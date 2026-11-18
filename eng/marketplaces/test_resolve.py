import unittest
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from resolve import DOCTOR, DOCTOR_SOURCE, discover, route, select, reviewed_files, doctor


class CapabilityTests(unittest.TestCase):
    def setUp(self):
        self.rows = discover()
        self.row = select(self.rows, "project-management", "dotagents-agent", "dotagents", "doctor")
        self.resolved = {**self.row, "resolution": "RESOLVED_SOURCE"}
        self.tmp = TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.project = Path(self.tmp.name).resolve()
        (self.project / "agents.toml").touch()
        self.checkouts = {DOCTOR_SOURCE["repository"]: self.project}

    def test_all_catalog_membership_routes(self):
        self.assertEqual(len(self.rows), 23)
        self.assertEqual(len({(r["marketplace"], r["address"]) for r in self.rows}), 23)
        self.assertEqual(sum(r["adapter"] == "dotagents-doctor" for r in self.rows), 1)

    def test_exact_agent_identity(self):
        with self.assertRaises(ValueError):
            select(self.rows, "project-management", "project-agent", "dotagents", "doctor")

    def test_handoff_preserves_prompt(self):
        raw = ' {"operation":"check"}\n'
        receipt = route(self.row, raw, {}, self.project)
        self.assertEqual(receipt["handoff"]["from"], "marketplace:resolver")
        self.assertEqual(receipt["handoff"]["chain"], [{"skill": DOCTOR, "prompt": raw}])
        self.assertEqual(receipt["invocation"], "NOT_INVOKED")

    @patch("resolve.doctor")
    def test_no_grant_means_no_call(self, provider):
        receipt = route(self.resolved, '{"operation":"check"}', self.checkouts, self.project, True)
        self.assertEqual(receipt["status"], "BLOCKED")
        self.assertEqual(receipt["reason"], "EXACT_OPERATOR_GRANT_REQUIRED")
        provider.assert_not_called()

    @patch("resolve.doctor")
    def test_no_mutating_operation(self, provider):
        for prompt in ('{"operation":"check","fix":true}', '{"operation":"fix"}', '{"operation":"check","apply":true}'):
            self.assertEqual(route(self.resolved, prompt, self.checkouts, self.project, True, [DOCTOR])["status"], "BLOCKED")
        provider.assert_not_called()

    @patch("resolve.doctor")
    def test_disabled_and_unresolved_are_denied(self, provider):
        for row in (self.row, {**self.resolved, "enabled": False}, {**self.resolved, "adapter": "HOST_ADAPTER_REQUIRED"}):
            self.assertEqual(route(row, '{"operation":"check"}', self.checkouts, self.project, True, [DOCTOR])["status"], "BLOCKED")
        provider.assert_not_called()

    @patch("resolve.doctor")
    def test_scope_must_be_absolute_and_initialized(self, provider):
        for project in (None, Path("."), self.project / "missing"):
            self.assertEqual(route(self.resolved, '{"operation":"check"}', self.checkouts, project, True, [DOCTOR])["status"], "BLOCKED")
        provider.assert_not_called()

    @patch("resolve.doctor", return_value={"status": "READY_FOR_HANDOFF", "invocation": "NOT_INVOKED"})
    def test_dry_run_never_requests_execution(self, provider):
        result = route(self.resolved, '{"operation":"check"}', self.checkouts, self.project)
        self.assertEqual(result["status"], "READY_FOR_HANDOFF")
        provider.assert_called_once_with(self.project, self.project, False)

    @patch("resolve.doctor")
    def test_host_skill_not_equated_with_execution(self, provider):
        row = select(self.rows, "plugin-creation", "plugin-agent", "plugin-creator", "create-plugin")
        row = {**row, "resolution": "RESOLVED_HOST"}
        result = route(row, '{}', {}, self.project, True, [row["address"]])
        self.assertEqual(result["status"], "BLOCKED")
        self.assertEqual(result["invocation"], "NOT_INVOKED")
        self.assertEqual(result["reason"], "HOST_ADAPTER_REQUIRED")
        provider.assert_not_called()

    @patch("resolve.git", return_value="unreviewed bytes")
    def test_reviewed_integrity_denial(self, _git):
        with self.assertRaisesRegex(ValueError, "integrity mismatch"):
            reviewed_files(self.project)

    @patch("resolve.reviewed_files", return_value={"skills/doctor/scripts/run.py": b"reviewed"})
    @patch("resolve.shutil.which", return_value="/local/dotagents")
    @patch("resolve.subprocess.run", return_value=subprocess.CompletedProcess([], 0,
           stdout=b"private path\nAll checks passed.\nProvider exit: 0\n", stderr=b"private stderr"))
    def test_receipt_redacts_raw_provider_output(self, call, _which, _files):
        result = doctor(self.project, self.project, True)
        self.assertEqual(result["status"], "PASS")
        self.assertNotIn("private", str(result))
        self.assertEqual(result["provider_exit"], 0)
        self.assertNotIn("--fix", call.call_args.args[0])
        self.assertNotIn("--apply", call.call_args.args[0])


if __name__ == "__main__":
    unittest.main()
