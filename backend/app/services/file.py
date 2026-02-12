from __future__ import annotations

from datetime import datetime, timedelta, timezone

import boto3

from app.config import get_settings

settings = get_settings()


def _s3_client():
    if settings.STORAGE_PROVIDER == "minio":
        return boto3.client(
            "s3",
            endpoint_url=f"http{'s' if settings.MINIO_SECURE else ''}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            region_name="us-east-1",
        )
    return boto3.client(
        "s3",
        aws_access_key_id=settings.S3_ACCESS_KEY_ID,
        aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
        region_name=settings.S3_REGION,
    )


def create_presigned_upload_url(key: str, expires_minutes: int = 30) -> str:
    client = _s3_client()
    bucket = settings.MINIO_BUCKET if settings.STORAGE_PROVIDER == "minio" else settings.S3_BUCKET
    return client.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=expires_minutes * 60,
    )


def object_key_for_resource(resource_id: str, filename: str) -> str:
    ts = int(datetime.now(timezone.utc).timestamp())
    return f"resources/{resource_id}/{ts}-{filename}"


def signed_manifest(manifest: dict) -> dict:
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    return {"manifest": manifest, "expires_at": expires_at.isoformat()}
