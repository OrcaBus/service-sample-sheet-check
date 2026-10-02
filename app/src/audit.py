#!/usr/bin/env python3

"""
AUDIT STORAGE

Stores a copy of every submitted sample sheet in S3 for auditing purposes.
Every submission is stored (pass or fail) under a date-partitioned prefix,
with the check status encoded in the filename so outcomes are visible from
a simple listing without needing object tags or opening the file.

Audit storage is a hard requirement: the bucket is always provisioned by
infrastructure, so any failure to store the audit copy (missing config,
permission error, S3 outage) is raised and will fail the request.
"""

import os
from datetime import datetime, timezone

import boto3

from src.errors import AuditStorageError
from src.logger import get_logger

logger = get_logger()

# Grab bucket name from environment variable. Infra always sets this.
SAMPLESHEET_AUDIT_BUCKET_NAME = os.environ.get("SAMPLESHEET_AUDIT_BUCKET_NAME", "")

s3_client = boto3.client("s3")


def _build_object_key(check_status: str, original_filename: str) -> str:
    """
    Build the S3 object key for a given request.
    e.g. SampleSheet/2026-10-01T14-32-07.123456Z_PASS_SampleSheet.csv

    The original filename is appended at the end of the key so the audit copy
    is identifiable by its source filename.
    """
    if not original_filename:
        raise AuditStorageError("original_filename is required to build the audit object key")

    now = datetime.now(timezone.utc)
    timestamp = now.strftime("%Y-%m-%dT%H-%M-%S.%f") + "Z"
    return f"SampleSheet/{timestamp}_{check_status}_{original_filename}"


def store_sample_sheet_for_audit(file_data: bytes, check_status: str, original_filename: str) -> str:
    """
    Upload the raw, as-submitted sample sheet bytes to the audit bucket.

    :param file_data: raw bytes of the submitted sample sheet
    :param check_status: "PASS" or "FAIL", encoded into the object key
    :param original_filename: the filename as submitted by the client, appended to the object key
    :return: the S3 object key the sample sheet was stored under
    :raises AuditStorageError: if the bucket is not configured or the upload fails
    """
    if not SAMPLESHEET_AUDIT_BUCKET_NAME:
        raise AuditStorageError("SAMPLESHEET_AUDIT_BUCKET_NAME is not set")

    object_key = _build_object_key(check_status, original_filename)

    try:
        s3_client.put_object(
            Bucket=SAMPLESHEET_AUDIT_BUCKET_NAME,
            Key=object_key,
            Body=file_data,
            ContentType="text/csv",
        )
    except Exception as e:
        logger.error(f"Failed to store sample sheet for audit at {object_key}: {e}")
        raise AuditStorageError(f"Failed to store sample sheet for audit: {e}") from e

    return object_key
