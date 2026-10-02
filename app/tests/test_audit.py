"""
Unit tests for audit storage

run: python -m unittest tests/test_audit.py

"""

import logging

from unittest import TestCase, mock

from src.errors import AuditStorageError
import src.audit as audit


class TestAuditUnitTestCase(TestCase):

    @classmethod
    def setUpClass(cls) -> None:
        logging.disable(logging.CRITICAL)
        print("\n---Running audit storage unit tests---")

    @mock.patch.object(audit, "SAMPLESHEET_AUDIT_BUCKET_NAME", "mock-audit-bucket")
    @mock.patch.object(audit, "s3_client", mock.MagicMock())
    def test_object_key_includes_filename_and_status(self):
        object_key = audit.store_sample_sheet_for_audit(
            b"col1,col2\nval1,val2\n", "PASS", "SampleSheet_v2.csv"
        )

        self.assertTrue(object_key.endswith("_PASS_SampleSheet_v2.csv"))
        self.assertTrue(object_key.startswith("SampleSheet/"))

    @mock.patch.object(audit, "SAMPLESHEET_AUDIT_BUCKET_NAME", "mock-audit-bucket")
    @mock.patch.object(audit, "s3_client", mock.MagicMock())
    def test_calls_put_object_with_expected_args(self):
        mock_s3 = mock.MagicMock()
        with mock.patch.object(audit, "s3_client", mock_s3):
            object_key = audit.store_sample_sheet_for_audit(
                b"raw-bytes", "FAIL", "my_sheet.csv"
            )

        mock_s3.put_object.assert_called_once_with(
            Bucket="mock-audit-bucket",
            Key=object_key,
            Body=b"raw-bytes",
            ContentType="text/csv",
        )

    @mock.patch.object(audit, "SAMPLESHEET_AUDIT_BUCKET_NAME", "")
    def test_raises_when_bucket_not_configured(self):
        with self.assertRaises(AuditStorageError):
            audit.store_sample_sheet_for_audit(b"raw-bytes", "PASS", "my_sheet.csv")

    @mock.patch.object(audit, "SAMPLESHEET_AUDIT_BUCKET_NAME", "mock-audit-bucket")
    def test_raises_when_original_filename_missing(self):
        with self.assertRaises(AuditStorageError):
            audit.store_sample_sheet_for_audit(b"raw-bytes", "PASS", "")

    @mock.patch.object(audit, "SAMPLESHEET_AUDIT_BUCKET_NAME", "mock-audit-bucket")
    def test_raises_audit_storage_error_on_put_object_failure(self):
        mock_s3 = mock.MagicMock()
        mock_s3.put_object.side_effect = Exception("S3 is down")
        with mock.patch.object(audit, "s3_client", mock_s3):
            with self.assertRaises(AuditStorageError):
                audit.store_sample_sheet_for_audit(b"raw-bytes", "PASS", "my_sheet.csv")
