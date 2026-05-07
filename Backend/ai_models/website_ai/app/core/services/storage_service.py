"""
File storage service (local, S3, MinIO)
Redesigned for scalable website ID-based storage
"""
import re
import shutil
from pathlib import Path
from typing import Tuple, Optional, Dict, List
import boto3
from botocore.exceptions import ClientError

from ai_models.website_ai.app.config import settings
from ai_models.website_ai.app.utils.logger import get_logger


logger = get_logger(__name__)


class StorageService:
    """Handle file storage operations with website ID-based structure"""

    def __init__(self):
        self.storage_type = settings.STORAGE_TYPE
        
        # New scalable storage paths - save to Backend/websites/
        # Get the Backend directory (5 levels up from this file)
        # storage_service.py -> services -> core -> app -> website_ai -> ai_models -> Backend
        backend_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent
        self.base_websites_dir = backend_dir / "websites"
        self.base_websites_dir.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"📁 Website storage directory: {self.base_websites_dir}")

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

    def get_website_directory(self, website_id: str) -> Path:
        """Get the directory path for a specific website"""
        return self.base_websites_dir / website_id

    def create_website_structure(self, website_id: str) -> Path:
        """Create directory structure for a website"""
        website_dir = self.get_website_directory(website_id)
        website_dir.mkdir(parents=True, exist_ok=True)
        
        # Create subdirectories for assets
        (website_dir / "assets").mkdir(exist_ok=True)
        (website_dir / "css").mkdir(exist_ok=True)
        (website_dir / "js").mkdir(exist_ok=True)
        (website_dir / "images").mkdir(exist_ok=True)
        
        logger.info(f"Created website directory structure: {website_dir}")
        return website_dir

    def save_website_files(
        self,
        website_id: str,
        html: str,
        css: Optional[str] = None,
        js: Optional[str] = None,
        assets: Optional[Dict[str, bytes]] = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Save complete website files using website ID structure

        Args:
            website_id: Unique website identifier
            html: HTML content
            css: Optional CSS content
            js: Optional JavaScript content
            assets: Optional dictionary of asset files {filename: content}

        Returns:
            Tuple of (local_path, s3_key) for the main HTML file
        """
        logger.info(f"💾 Saving website files for ID: {website_id}")

        if self.storage_type == "local":
            return self._save_website_local(website_id, html, css, js, assets), None
        else:
            return None, self._save_website_s3(website_id, html, css, js, assets)

    def _save_website_local(
        self,
        website_id: str,
        html: str,
        css: Optional[str] = None,
        js: Optional[str] = None,
        assets: Optional[Dict[str, bytes]] = None
    ) -> str:
        """Save website files to local filesystem with ID-based structure"""
        website_dir = self.create_website_structure(website_id)

        # Save main HTML file
        html_path = website_dir / "index.html"
        html_path.write_text(html, encoding="utf-8")
        logger.info(f"✅ Saved HTML: {html_path}")

        # Save CSS file if provided
        if css:
            css_path = website_dir / "css" / "styles.css"
            css_path.write_text(css, encoding="utf-8")
            logger.info(f"✅ Saved CSS: {css_path}")

        # Save JavaScript file if provided
        if js:
            js_path = website_dir / "js" / "script.js"
            js_path.write_text(js, encoding="utf-8")
            logger.info(f"✅ Saved JS: {js_path}")

        # Save additional assets if provided
        if assets:
            for filename, content in assets.items():
                asset_path = website_dir / "assets" / filename
                if isinstance(content, str):
                    asset_path.write_text(content, encoding="utf-8")
                else:
                    asset_path.write_bytes(content)
                logger.info(f"✅ Saved asset: {asset_path}")

        logger.info(f"🎉 Website {website_id} saved successfully to: {website_dir}")
        return str(html_path)

    def _save_website_s3(
        self,
        website_id: str,
        html: str,
        css: Optional[str] = None,
        js: Optional[str] = None,
        assets: Optional[Dict[str, bytes]] = None
    ) -> str:
        """Save website files to S3/MinIO with ID-based structure"""
        base_key = f"websites/{website_id}"

        # Save main HTML file
        html_key = f"{base_key}/index.html"
        self.s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=html_key,
            Body=html.encode("utf-8"),
            ContentType="text/html",
            ACL="public-read"
        )
        logger.info(f"✅ Saved HTML to S3: {html_key}")

        # Save CSS file if provided
        if css:
            css_key = f"{base_key}/css/styles.css"
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=css_key,
                Body=css.encode("utf-8"),
                ContentType="text/css",
                ACL="public-read"
            )
            logger.info(f"✅ Saved CSS to S3: {css_key}")

        # Save JavaScript file if provided
        if js:
            js_key = f"{base_key}/js/script.js"
            self.s3_client.put_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=js_key,
                Body=js.encode("utf-8"),
                ContentType="application/javascript",
                ACL="public-read"
            )
            logger.info(f"✅ Saved JS to S3: {js_key}")

        # Save additional assets if provided
        if assets:
            for filename, content in assets.items():
                asset_key = f"{base_key}/assets/{filename}"
                content_type = self._get_content_type(filename)
                
                if isinstance(content, str):
                    body = content.encode("utf-8")
                else:
                    body = content
                
                self.s3_client.put_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=asset_key,
                    Body=body,
                    ContentType=content_type,
                    ACL="public-read"
                )
                logger.info(f"✅ Saved asset to S3: {asset_key}")

        logger.info(f"🎉 Website {website_id} saved successfully to S3")
        return html_key

    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        extension = Path(filename).suffix.lower()
        content_types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject'
        }
        return content_types.get(extension, 'application/octet-stream')

    # Legacy methods for backward compatibility
    def save_html(
        self,
        html: str,
        business_name: str,
        theme: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Legacy method - Save HTML file to storage
        
        DEPRECATED: Use save_website_files() with website_id instead
        """
        logger.warning("⚠️  Using deprecated save_html method. Use save_website_files() instead.")
        filename = self._safe_filename(business_name, theme)

        if self.storage_type == "local":
            return self._save_local(html, filename), None
        else:
            return None, self._save_s3(html, filename)

    def _save_local(self, html: str, filename: str) -> str:
        """Legacy local save method"""
        output_dir = Path(settings.LOCAL_STORAGE_PATH)
        output_dir.mkdir(parents=True, exist_ok=True)

        file_path = output_dir / filename
        file_path.write_text(html, encoding="utf-8")

        logger.info(f"Saved HTML to local (legacy): {file_path}")
        return str(file_path)

    def _save_s3(self, html: str, filename: str) -> str:
        """Legacy S3 save method"""
        s3_key = f"websites/{filename}"

        self.s3_client.put_object(
            Bucket=settings.S3_BUCKET_NAME,
            Key=s3_key,
            Body=html.encode("utf-8"),
            ContentType="text/html",
            ACL="public-read"
        )

        logger.info(f"Saved HTML to S3 (legacy): {s3_key}")
        return s3_key

    def get_website_url(self, website_id: str) -> str:
        """
        Get the public URL for a website using the new routing system

        Args:
            website_id: Unique website identifier

        Returns:
            Public URL for the website
        """
        return f"/website/{website_id}"

    def get_public_url(self, key_or_path: str) -> str:
        """
        Legacy method - Get public URL for file
        
        DEPRECATED: Use get_website_url() for new websites
        """
        logger.warning("⚠️  Using deprecated get_public_url method. Use get_website_url() instead.")
        
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

    def delete_website(self, website_id: str) -> bool:
        """
        Delete all files for a website

        Args:
            website_id: Unique website identifier

        Returns:
            True if deleted successfully
        """
        try:
            if self.storage_type == "local":
                website_dir = self.get_website_directory(website_id)
                if website_dir.exists():
                    shutil.rmtree(website_dir)
                    logger.info(f"🗑️  Deleted website directory: {website_dir}")
            else:
                # Delete all S3 objects with the website prefix
                base_key = f"websites/{website_id}/"
                objects = self.s3_client.list_objects_v2(
                    Bucket=settings.S3_BUCKET_NAME,
                    Prefix=base_key
                )
                
                if 'Contents' in objects:
                    delete_keys = [{'Key': obj['Key']} for obj in objects['Contents']]
                    self.s3_client.delete_objects(
                        Bucket=settings.S3_BUCKET_NAME,
                        Delete={'Objects': delete_keys}
                    )
                    logger.info(f"🗑️  Deleted {len(delete_keys)} S3 objects for website {website_id}")

            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete website {website_id}: {e}")
            return False

    def delete_file(self, key_or_path: str) -> bool:
        """
        Legacy method - Delete file from storage
        
        DEPRECATED: Use delete_website() for complete website deletion
        """
        logger.warning("⚠️  Using deprecated delete_file method. Use delete_website() instead.")
        
        try:
            if self.storage_type == "local":
                Path(key_or_path).unlink(missing_ok=True)
            else:
                self.s3_client.delete_object(
                    Bucket=settings.S3_BUCKET_NAME,
                    Key=key_or_path
                )
            logger.info(f"Deleted file (legacy): {key_or_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file {key_or_path}: {e}")
            return False

    def list_website_files(self, website_id: str) -> List[str]:
        """
        List all files for a website

        Args:
            website_id: Unique website identifier

        Returns:
            List of file paths relative to website directory
        """
        files = []
        
        try:
            if self.storage_type == "local":
                website_dir = self.get_website_directory(website_id)
                if website_dir.exists():
                    for file_path in website_dir.rglob("*"):
                        if file_path.is_file():
                            relative_path = file_path.relative_to(website_dir)
                            files.append(str(relative_path))
            else:
                # List S3 objects
                base_key = f"websites/{website_id}/"
                objects = self.s3_client.list_objects_v2(
                    Bucket=settings.S3_BUCKET_NAME,
                    Prefix=base_key
                )
                
                if 'Contents' in objects:
                    for obj in objects['Contents']:
                        # Remove the base key prefix to get relative path
                        relative_path = obj['Key'][len(base_key):]
                        if relative_path:  # Skip empty keys
                            files.append(relative_path)
            
            logger.info(f"📁 Found {len(files)} files for website {website_id}")
            return files
            
        except Exception as e:
            logger.error(f"❌ Failed to list files for website {website_id}: {e}")
            return []

