"""
File storage service (local, S3, MinIO)
"""
import re
from pathlib import Path
from typing import Tuple, Optional
import boto3
from botocore.exceptions import ClientError

from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.utils.logger import get_logger


logger = get_logger(__name__)


class StorageService:
    """Handle file storage operations"""

    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE

        if self.storage_type in ["s3", "minio"]:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.S3_ENDPOINT,
                aws_access_key_id=settings.S3_ACCESS_KEY,
                aws_secret_access_key=settings.S3_SECRET_KEY,
                region_name=settings.S3_REGION
            )
            self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Ensure S3 bucket exists"""
        try:
            self.s3_client.head_bucket(Bucket=settings.S3_BUCKET_NAME)
        except ClientError:
            logger.info(f"Creating bucket: {settings.S3_BUCKET_NAME}")
            self.s3_client.create_bucket(Bucket=settings.S3_BUCKET_NAME)

    def _safe_filename(self, business_name: str, theme: str) -> str:
        """Generate safe filename"""
        safe_name = re.sub(r"[^a-zA-Z0-9]+", "-", business_name.strip().lower()).strip("-")
        return f"{safe_name or 'website'}_{theme}.html"

    def save_html(
        self,
        html: str,
        business_name: str,
        theme: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Save HTML file to storage

        Args:
            html: HTML content
            business_name: Business name for filename
            theme: Theme name

        Returns:
            Tuple of (local_path, s3_key)
        """
        filename = self._safe_filename(business_name, theme)

        if self.storage_type == "local":
            return self._save_local(html, filename), None
        else:
            return None, self._save_s3(html, filename)

    def _save_local(self, html: str, filename: str) -> str:
        """Save to local filesystem"""
        output_dir = Path(settings.LOCAL_STORAGE_PATH)
        output_dir.mkdir(parents=True, exist_ok=True)

        file_path = output_dir / filename
        file_path.write_text(html, encoding="utf-8")

        logger.info(f"Saved HTML to local: {file_path}")
        return str(file_path)

    def _save_s3(self, html: str, filename: str) -> str:
        """Save to S3/MinIO"""
        s3_key = f"websites/{filename}"

        self.s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
            Body=html.encode("utf-8"),
            ContentType="text/html",
            ACL="public-read"  # Make publicly accessible
        )

        logger.info(f"Saved HTML to S3: {s3_key}")
        return s3_key

    def get_public_url(self, key_or_path: str) -> str:
        """
        Get public URL for file

        Args:
            key_or_path: S3 key or local path

        Returns:
            Public URL
        """
        if self.storage_type == "local":
            # Return relative URL for local files
            filename = Path(key_or_path).name
            return f"/website-ai/output/{filename}"
        else:
            # Return S3 URL
            if settings.S3_ENDPOINT:
                # MinIO or custom S3
                return f"{settings.S3_ENDPOINT}/{settings.S3_BUCKET_NAME}/{key_or_path}"
            else:
                # AWS S3
                return f"https://{settings.S3_BUCKET_NAME}.s3.{settings.S3_REGION}.amazonaws.com/{key_or_path}"

    def delete_file(self, key_or_path: str) -> bool:
        """
        Delete file from storage

        Args:
            key_or_path: S3 key or local path

        Returns:
            True if deleted successfully
        """
        try:
            if self.storage_type == "local":
                Path(key_or_path).unlink(missing_ok=True)
            else:
                self.s3_client.delete_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=key_or_path
                )
            logger.info(f"Deleted file: {key_or_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file {key_or_path}: {e}")
            return False

