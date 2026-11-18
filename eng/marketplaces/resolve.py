"""Discover catalog capabilities and invoke one explicitly granted provider.

This is an operator-local bridge, not a second PMCR-O chain dispatcher or web
execution endpoint. Catalog membership never grants permission to execute.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from validate import ROOT, DOMAINS, git, pairs, parse, require, validate
from read_adapters import LIST, PROJECT, source, invoke_list, invoke_project

DOCTOR = "/dotagents:doctor"
DOCTOR_SOURCE = {
    "type": "github-plugin", "repository": "shawn2024bellazan-prog/agent-skills",
    "ref": "34f893fbdd9243a1e55d46e8a04d57a7d5ca1ba1", "path": "plugins/dotagents",
}
DOCTOR_FILES = {
    "skills/doctor/scripts/run.py": "02c0f0eab253dc24f42458d28ba4df445049a32dc537f844ef92f541386ae374",
    "skills/dotagents/scripts/dotagents.py": "4a4a7c369882e20d6c1281726ce94314df9563986aa422e58d0d4248f5811928",
}


def discover(root=ROOT, checkouts=None, host=None, selected=None):
    findings = validate(root, checkouts, host, selected)
    resolved = {(f["marketplace"], f["plugin"]): f["resolution"] for f in findings}
    rows = []
    for domain in sorted(DOMAINS if selected is None else {selected}):
        catalog = parse((root / "marketplaces" / domain / "marketplace.yaml").read_text(encoding="utf-8"))
        for member in catalog["plugins"]:
            for skill in member["skills"]:
                address = f"/{member['name']}:{skill}"
                adapter = "HOST_ADAPTER_REQUIRED"
                if domain == "project-management" and member["agent"] == "dotagents-agent" and member["source"] == DOCTOR_SOURCE:
                    adapter = {DOCTOR: "dotagents-doctor", LIST: "dotagents-list"}.get(address, adapter)
                if domain == "project-management" and member["agent"] == "project-agent" and address == PROJECT and member["source"] == source("projects"):
                    adapter = "project-lifecycle-read"
                rows.append({"marketplace": domain, "agent": member["agent"], "plugin": member["name"],
                             "skill": skill, "address": address, "source": member["source"],
                             "enabled": member["enabled"], "resolution": resolved[(domain, member["name"])],
                             "adapter": adapter})
    return rows


def select(rows, domain, agent, plugin, skill):
    matches = [row for row in rows if (row["marketplace"], row["agent"], row["plugin"], row["skill"])
               == (domain, agent, plugin, skill)]
    require(len(matches) == 1, "Exact marketplace/agent/plugin/skill membership not found")
    return matches[0]


def intent(row, prompt):
    require(isinstance(prompt, str) and len(prompt.encode("utf-8")) <= 16384, "Prompt exceeds limit")
    return {"kind": "BehavioralIntent", "version": 1, "from": "marketplace:resolver",
            "to": f"{row['plugin']}:{row['agent']}", "chain": [{"skill": row["address"], "prompt": prompt}]}


def approved_project(value, dotagents=True):
    require(value is not None and value.is_absolute(), "Explicit absolute project root required")
    root = value.resolve(strict=True)
    require(value == root and root.is_dir() and ".pmcro" not in root.parts,
            "Project must be an existing canonical directory outside private PMCR-O state")
    if dotagents:
        require((root / "agents.toml").is_file(), "Project is not initialized for DotAgents")
    return root


def reviewed_files(checkout):
    result = {}
    for rel, digest in DOCTOR_FILES.items():
        data = git(checkout, "show", f"{DOCTOR_SOURCE['ref']}:{DOCTOR_SOURCE['path']}/{rel}").encode("utf-8")
        require(hashlib.sha256(data).hexdigest() == digest, "Reviewed adapter integrity mismatch")
        result[rel] = data
    return result


def doctor(checkout, project, execute):
    # Re-read reviewed immutable Git objects, never a mutable checkout script.
    files = reviewed_files(checkout)
    require(shutil.which("dotagents") is not None, "DotAgents CLI unavailable on this host")
    if not execute:
        return {"status": "READY_FOR_HANDOFF", "invocation": "NOT_INVOKED"}
    print("@dotagents-agent -> dotagents -> doctor -> /dotagents:doctor", file=sys.stderr, flush=True)
    # Materialize the two reviewed executable files in an isolated transient
    # directory. No caller-supplied script, --fix, --apply, or shell is allowed.
    with tempfile.TemporaryDirectory(prefix="pmcro-dotagents-") as directory:
        base = Path(directory)
        for rel, data in files.items():
            path = base / rel
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        result = subprocess.run([sys.executable, "-I", "-B", str(base / "skills/doctor/scripts/run.py"),
                                 "--project", str(project)], cwd=project, stdin=subprocess.DEVNULL,
                                capture_output=True, timeout=30, check=False)
    # Provider stdout can contain project paths; publish only a digest and
    # observed non-sensitive receipt, never its raw output or stderr.
    receipts = re.findall(rb"(?m)^Provider exit: ([0-9]+)\r?$", result.stdout)
    native_exit = int(receipts[0]) if len(receipts) == 1 else None
    passed = result.returncode == 0 and native_exit == 0 and b"All checks passed." in result.stdout
    return {"status": "PASS" if passed else "FAIL", "invocation": "INVOKED" if native_exit is not None else "UNVERIFIED",
            "adapter_exit": result.returncode, "provider_exit": native_exit,
            "stdout_sha256": hashlib.sha256(result.stdout).hexdigest(), "check_passed": passed}


def route(row, prompt, checkouts, project=None, execute=False, allowed=(), project_id=None, state=None, bound_adapter=None):
    receipt = {"kind": "MarketplaceCapabilityReceipt", "capability": row,
               "handoff": intent(row, prompt), "invocation": "NOT_INVOKED"}
    def blocked(reason):
        return {**receipt, "status": "BLOCKED", "reason": reason}

    if not row["enabled"]:
        return blocked("MEMBERSHIP_DISABLED")
    if row["resolution"] not in {"RESOLVED_SOURCE", "RESOLVED_HOST"}:
        return blocked("PROVIDER_DISCOVERY_REQUIRED")
    expected = {DOCTOR: ("dotagents-doctor", DOCTOR_SOURCE), LIST: ("dotagents-list", DOCTOR_SOURCE),
                PROJECT: ("project-lifecycle-read", source("projects"))}.get(row["address"])
    if expected is None or (row["adapter"], row["source"]) != expected:
        return blocked("HOST_ADAPTER_REQUIRED")
    if execute and tuple(allowed) != (row["address"],):
        return blocked("EXACT_OPERATOR_GRANT_REQUIRED")
    try:
        request = parse(prompt)
        require(isinstance(request, dict) and set(request) == {"operation"}, "Exact read-only operation required")
        operations = {DOCTOR: ("check",), LIST: ("list",), PROJECT: ("status", "runtime")}
        require(request["operation"] in operations[row["address"]], "Invalid read-only operation")
    except (ValueError, TypeError, RecursionError):
        return blocked("INVALID_READ_ONLY_REQUEST")
    try:
        root = approved_project(project, dotagents=row["address"] != PROJECT)
    except (ValueError, OSError, RuntimeError):
        return blocked("PROJECT_SCOPE_INVALID")
    try:
        checkout = checkouts[row["source"]["repository"]]
        if row["address"] == DOCTOR:
            receipt.update(doctor(checkout, root, execute))
        elif row["address"] == LIST:
            receipt.update(invoke_list(checkout, root, execute))
        else:
            receipt.update(invoke_project(checkout, root, project_id, state, request["operation"], bound_adapter, execute))
    except subprocess.TimeoutExpired:
        receipt.update(status="FAIL", invocation="UNVERIFIED", reason="Provider timed out; do not retry without checking state")
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError, TypeError):
        # Do not expose provider paths or secret-bearing exception text.
        receipt.update(status="BLOCKED", reason="PROVIDER_PREFLIGHT_FAILED")
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["discover", "resolve"])
    parser.add_argument("--marketplace", choices=sorted(DOMAINS))
    parser.add_argument("--agent")
    parser.add_argument("--plugin")
    parser.add_argument("--skill")
    parser.add_argument("--checkout", action="append", default=[], metavar="OWNER/REPO=PATH")
    parser.add_argument("--host", action="append", default=[], metavar="PLUGIN=SKILL,SKILL")
    parser.add_argument("--project", type=Path)
    parser.add_argument("--project-id")
    parser.add_argument("--pmcro-root", type=Path)
    parser.add_argument("--bound-adapter", type=Path, help="Independently approved exact bound DotAgents adapter path for runtime")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--allow", action="append", default=[])
    args = parser.parse_args()
    try:
        checkouts = pairs(args.checkout)
        host = {k: v.split(",") for k, v in pairs(args.host).items()}
        rows = discover(ROOT, checkouts, host, args.marketplace)
        if args.action == "discover":
            require(not args.execute and not args.allow, "Discovery cannot execute")
            print(json.dumps({"status": "PASS", "invocation": "NOT_INVOKED", "capabilities": rows}, indent=2))
            return 0
        row = select(rows, args.marketplace, args.agent, args.plugin, args.skill)
        raw = sys.stdin.buffer.read(16385)
        require(len(raw) <= 16384, "Prompt exceeds limit")
        receipt = route(row, raw.decode("utf-8"), checkouts, args.project, args.execute, args.allow,
                        args.project_id, args.pmcro_root, args.bound_adapter)
        # The prompt is retained for local handoff. Do not publish receipts with private inputs.
        print(json.dumps(receipt, indent=2))
        return 0 if receipt["status"] in {"PASS", "READY_FOR_HANDOFF"} else 1
    except (OSError, ValueError, KeyError, TypeError, subprocess.CalledProcessError):
        print(json.dumps({"status": "BLOCKED", "invocation": "NOT_INVOKED", "reason": "Invalid request or provider source"}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
