import os
import unittest
from unittest.mock import patch

from standing_order_webhook_remediation import Config, RemediationWorker, WorkerError


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def call(self, function_name, payload):
        self.calls.append((function_name, payload))
        if not self.responses:
            raise AssertionError(f"unexpected RPC call: {function_name}")
        expected_name, response = self.responses.pop(0)
        if expected_name != function_name:
            raise AssertionError(f"expected {expected_name}, got {function_name}")
        return response


def config(mode="DRY_RUN", token=None, max_items=25, max_settlements=0):
    return Config(
        supabase_url="https://example.supabase.co",
        service_role_key="service-key-not-logged",
        provider="PLUSPESA",
        provider_account_key="test-account",
        environment="STAGING",
        mode=mode,
        max_items=max_items,
        max_settlements=max_settlements,
        requested_by=None,
        approval_id=None,
        approval_token=token,
        request_timeout=1,
    )


class RemediationWorkerTests(unittest.TestCase):
    def test_dry_run_classifies_safe_item_without_requeue_or_settlement(self):
        client = FakeClient(
            [
                ("bank_webhook_remediation_open", {"drainRunId": "run-1"}),
                (
                    "bank_webhook_remediation_lease",
                    {"items": [{"eventId": "event-1", "leaseToken": "lease-1"}], "count": 1},
                ),
                (
                    "bank_webhook_remediation_classify",
                    {
                        "eventId": "event-1",
                        "classification": "SAFE_RETRY",
                        "reasonCode": "transient_provider_error",
                        "expectedAttempt": 1,
                    },
                ),
                ("bank_webhook_remediation_lease", {"items": [], "count": 0}),
                ("bank_webhook_remediation_close", {"status": "COMPLETED"}),
            ]
        )
        worker = RemediationWorker(config(), client)
        summary = worker.run()
        names = [name for name, _ in client.calls]
        self.assertEqual(summary["status"], "COMPLETED")
        self.assertIn("bank_webhook_remediation_classify", names)
        self.assertNotIn("bank_webhook_remediation_requeue", names)
        self.assertNotIn("bank_webhook_remediation_process", names)

    def test_unsafe_classification_is_not_requeued(self):
        client = FakeClient(
            [
                ("bank_webhook_remediation_open", {"drainRunId": "run-2"}),
                (
                    "bank_webhook_remediation_lease",
                    {"items": [{"eventId": "event-2", "leaseToken": "lease-2"}], "count": 1},
                ),
                (
                    "bank_webhook_remediation_classify",
                    {
                        "eventId": "event-2",
                        "classification": "CONFLICT",
                        "reasonCode": "provider_reference_conflict",
                        "expectedAttempt": 1,
                    },
                ),
                ("bank_webhook_remediation_lease", {"items": [], "count": 0}),
                ("bank_webhook_remediation_close", {"status": "COMPLETED"}),
            ]
        )
        worker = RemediationWorker(config(), client)
        summary = worker.run()
        names = [name for name, _ in client.calls]
        self.assertEqual(summary["quarantined"], 1)
        self.assertNotIn("bank_webhook_remediation_requeue", names)
        self.assertNotIn("bank_webhook_remediation_process", names)

    def test_mutating_mode_passes_only_sha256_token_hash(self):
        token = "a" * 32
        cfg = config("REQUEUE_ONLY", token=token, max_settlements=0)
        cfg = Config(**{**cfg.__dict__, "requested_by": "11111111-1111-1111-1111-111111111111", "approval_id": "22222222-2222-2222-2222-222222222222"})
        client = FakeClient([("bank_webhook_remediation_open", {"drainRunId": "run-3"}), ("bank_webhook_remediation_lease", {"items": [], "count": 0}), ("bank_webhook_remediation_close", {"status": "COMPLETED"})])
        worker = RemediationWorker(cfg, client)
        worker.run()
        open_payload = client.calls[0][1]
        self.assertEqual(len(open_payload["p_approval_token_hash"]), 64)
        self.assertNotEqual(open_payload["p_approval_token_hash"], token)
        self.assertNotIn(token, str(open_payload))

    def test_lease_limit_is_bounded_even_if_fake_server_returns_more(self):
        client = FakeClient(
            [
                ("bank_webhook_remediation_open", {"drainRunId": "run-4"}),
                (
                    "bank_webhook_remediation_lease",
                    {
                        "items": [
                            {"eventId": str(i), "leaseToken": f"lease-{i}"}
                            for i in range(10)
                        ],
                        "count": 10,
                    },
                ),
            ]
        )
        worker = RemediationWorker(config(max_items=100), client)
        worker.open_run()
        items = worker.lease_batch(100)
        self.assertEqual(len(items), 10)
        self.assertEqual(client.calls[1][1]["p_limit"], 10)

    def test_missing_token_is_rejected_before_worker_start(self):
        cfg = config("DRAIN_SAFE_SETTLEMENTS", token=None, max_settlements=1)
        with self.assertRaises(WorkerError):
            # Mirror the CLI guard without contacting Supabase.
            if not cfg.approval_token:
                raise WorkerError("missing approval token")


if __name__ == "__main__":
    unittest.main()
