"""Cross-repository contract tests; provider-specific tests belong to its pinned source."""
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from resolve import PIN, ROOT, materialize

PROVIDER = Path(os.environ["PMCRO_MARKETPLACE_PROVIDER_CHECKOUT"]).resolve()
CLI = ROOT / "eng/marketplaces/resolve.py"


class BridgeTests(unittest.TestCase):
    def call(self, *args, prompt="", env=None, checkout=PROVIDER):
        result = subprocess.run([sys.executable, "-I", "-B", str(CLI), *args,
                                 "--provider-checkout", str(checkout)],
                                input=prompt, text=True, capture_output=True, env=env)
        return result, json.loads(result.stdout)

    def test_discovery(self):
        result, report = self.call("discover")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(report["capabilities"]), 23)
        self.assertEqual(report["invocation"], "NOT_INVOKED")
        self.assertIn(PIN, result.stderr)

    def test_wrong_checkout_blocks(self):
        result, report = self.call("discover", checkout=ROOT)
        self.assertEqual(result.returncode, 2)
        self.assertEqual(report["invocation"], "NOT_INVOKED")

    def test_pin_materializes_exact_source(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            materialize(PROVIDER, target)
            original = subprocess.check_output(["git", "--no-replace-objects", "-C", str(PROVIDER),
                "show", f"{PIN}:skills/marketplace/scripts/trail.py"])
            self.assertEqual((target / "skills/marketplace/scripts/trail.py").read_bytes(), original)

    def test_cycle_persists_and_reopens(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            private = home / ".pmcro"
            for path in (private, private / "projects", private / "projects" / "test-project"):
                path.mkdir(mode=0o700)
            env = {**os.environ, "HOME": str(home)}
            result, run = self.call("catalog-cycle", "--operation", "run", "--project-id",
                                    "test-project", "--execute", env=env)
            self.assertEqual(result.returncode, 0, result.stderr)
            trail = private / "projects/test-project/trails" / run["trail_id"]
            self.assertEqual(len(list(trail.glob("*.jsonl"))), 10)
            self.assertTrue((trail / "disposition.json").is_file())
            result, verified = self.call("catalog-cycle", "--operation", "verify", "--project-id",
                "test-project", "--trail-id", run["trail_id"], env=env)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(verified["checker"], "PASS")
            self.assertEqual(verified["reflector"], "ACCEPT")
            self.assertEqual(verified["provider_invocation"], "NOT_INVOKED")
            self.assertEqual(verified["approval"], "NOT_ISSUED")

    def test_execute_without_private_project_is_denied(self):
        result, report = self.call("resolve", "--marketplace", "project-management",
            "--agent", "dotagents-agent", "--plugin", "dotagents", "--skill", "list",
            "--execute", "--allow", "/dotagents:list", prompt='{"operation":"list"}')
        self.assertEqual(result.returncode, 2)
        self.assertEqual(report["invocation"], "NOT_INVOKED")


if __name__ == "__main__":
    unittest.main()
