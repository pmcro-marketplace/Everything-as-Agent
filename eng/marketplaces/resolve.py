"""Delegate to the reviewed Marketplace Agent without executing mutable checkout files."""
import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROVIDER = "pmcro-marketplace/marketplace-agent"
PIN = "5a384a33fed247fb2b85b177ccb9b6ca3901c36c"
SCRIPTS = "skills/marketplace/scripts/"
FILES = tuple(SCRIPTS + name for name in (
    "resolve.py", "read_adapters.py", "trail.py", "validate_catalogs.py", "catalog_cycle.py",
)) + ("skills/creator/scripts/setup_marketplaces.py", "skills/creator/assets/setup-plan.json")


def git(checkout, *args):
    return subprocess.run(
        ["git", "--no-replace-objects", "-C", str(checkout), *args],
        capture_output=True, check=True, timeout=20,
    ).stdout


def materialize(checkout, target):
    if not checkout.is_absolute() or checkout != checkout.resolve(strict=True):
        raise ValueError("Canonical absolute provider checkout required")
    origin = git(checkout, "remote", "get-url", "origin").decode().strip()
    if origin not in {f"https://github.com/{PROVIDER}", f"https://github.com/{PROVIDER}.git"}:
        raise ValueError("Marketplace Agent origin mismatch")
    if git(checkout, "rev-parse", f"{PIN}^{{commit}}").decode().strip() != PIN:
        raise ValueError("Reviewed provider pin unavailable")
    for name in FILES:
        entry = git(checkout, "ls-tree", PIN, "--", name).decode().split()
        if len(entry) != 4 or entry[0] not in {"100644", "100755"} or entry[1] != "blob" or entry[3] != name:
            raise ValueError("Invalid immutable provider file")
        path = target / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(git(checkout, "show", f"{PIN}:{name}"))


def main():
    parser = argparse.ArgumentParser(description=__doc__, allow_abbrev=False)
    parser.add_argument("action", choices=("discover", "resolve", "catalog-cycle"))
    parser.add_argument("--provider-checkout", type=Path, required=True)
    parser.add_argument("--marketplace")
    parser.add_argument("--agent")
    parser.add_argument("--plugin")
    parser.add_argument("--skill")
    parser.add_argument("--checkout", action="append", default=[])
    parser.add_argument("--host", action="append", default=[])
    parser.add_argument("--project")
    parser.add_argument("--project-id")
    parser.add_argument("--pmcro-root")
    parser.add_argument("--bound-adapter")
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--allow", action="append", default=[])
    parser.add_argument("--operation", choices=("run", "verify"))
    parser.add_argument("--trail-id")
    args = parser.parse_args()
    try:
        route_flags = ("marketplace", "agent", "plugin", "skill", "checkout",
                       "host", "project", "pmcro_root", "bound_adapter", "allow")
        if args.action == "catalog-cycle":
            if not args.operation or not args.project_id or any(getattr(args, k) for k in route_flags):
                raise ValueError("Catalog cycle accepts only its explicit project and operation")
            if args.operation == "run" and (not args.execute or args.trail_id):
                raise ValueError("Running a cycle requires explicit execution; no caller-selected trail ID")
            if args.operation == "verify" and (args.execute or not args.trail_id):
                raise ValueError("Verification requires an existing trail ID and no execution")
            script = "catalog_cycle.py"
            forwarded = [args.operation, "--project-id", args.project_id]
            if args.trail_id:
                forwarded += ["--trail-id", args.trail_id]
        else:
            if args.operation or args.trail_id:
                raise ValueError("Cycle options are not resolver options")
            script = "resolve.py"
            forwarded = [args.action, "--catalog-root", str(ROOT)]
            for key in (*route_flags, "project_id"):
                value = getattr(args, key)
                for item in value if isinstance(value, list) else [value]:
                    if item is not None:
                        forwarded.append(f"--{key.replace('_', '-')}={item}")
            if args.execute:
                forwarded.append("--execute")
        with tempfile.TemporaryDirectory(prefix="pmcro-marketplace-provider-") as directory:
            target = Path(directory)
            materialize(args.provider_checkout, target)
            # Use isolated Python, explicitly adding only the reviewed script
            # directory to its import path. No unreviewed checkout code executes.
            entry = target / SCRIPTS / script
            launch = "import runpy,sys; p=sys.argv.pop(1); sys.path.insert(0,str(__import__('pathlib').Path(p).parent)); sys.argv[0]=p; runpy.run_path(p,run_name='__main__')"
            print(f"Marketplace Agent {PROVIDER}@{PIN}: {args.action}", file=sys.stderr, flush=True)
            return subprocess.run([sys.executable, "-I", "-B", "-c", launch, str(entry), *forwarded],
                                  cwd=ROOT, check=False).returncode
    except (OSError, ValueError, subprocess.SubprocessError, UnicodeError):
        print(json.dumps({"status": "BLOCKED", "invocation": "NOT_INVOKED",
                          "reason": "Reviewed Marketplace Agent provider unavailable or invalid bridge request"}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
