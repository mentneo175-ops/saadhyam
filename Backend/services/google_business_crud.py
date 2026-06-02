import logging
from typing import List, Tuple, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from models.instagram import SocialAccount
from models.google_business import (
    GoogleBusinessAccount,
    GoogleBusinessLocation,
    GoogleBusinessReview,
    GoogleBusinessPost,
)

logger = logging.getLogger(__name__)


class GoogleBusinessCRUD:
    """CRUD operations for Google Business Profile-related database models (async version)."""

    @staticmethod
    def _to_utc_naive(value: Optional[datetime]) -> Optional[datetime]:
        if value is None:
            return None
        if value.tzinfo is None:
            return value
        return value.astimezone(timezone.utc).replace(tzinfo=None)

    @staticmethod
    async def create_google_business_account(
        db: AsyncSession,
        user_id: int,
        access_token: str,
        refresh_token: Optional[str],
        expires_in: int,
        account_data: dict,
    ) -> GoogleBusinessAccount:
        """Create or update SocialAccount and GoogleBusinessAccount records."""
        try:
            # Step 1: Create or update SocialAccount (representing the OAuth login)
            stmt = select(SocialAccount).where(
                and_(
                    SocialAccount.user_id == user_id,
                    SocialAccount.platform == "google_business",
                    SocialAccount.ig_user_id == account_data["account_id"]  # Store google account_id in ig_user_id to reuse column
                )
            )
            result = await db.execute(stmt)
            existing_account = result.scalar_one_or_none()

            if existing_account:
                logger.info(f"Reactivating existing SocialAccount {existing_account.id} for Google Business")
                existing_account.access_token = access_token
                if refresh_token:
                    existing_account.refresh_token = refresh_token
                existing_account.ig_username = account_data["account_name"]
                existing_account.is_active = True
                existing_account.disconnected_at = None
                existing_account.connected_at = datetime.utcnow()
                db.add(existing_account)
                social_account = existing_account
            else:
                logger.info("Creating new SocialAccount for Google Business")
                social_account = SocialAccount(
                    user_id=user_id,
                    platform="google_business",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    ig_user_id=account_data["account_id"],
                    ig_username=account_data["account_name"],
                    is_active=True
                )
                db.add(social_account)

            await db.commit()
            await db.refresh(social_account)

            # Step 2: Create or update GoogleBusinessAccount record
            stmt_gb = select(GoogleBusinessAccount).where(
                and_(
                    GoogleBusinessAccount.user_id == user_id,
                    GoogleBusinessAccount.account_id == account_data["account_id"]
                )
            )
            result_gb = await db.execute(stmt_gb)
            existing_gb = result_gb.scalar_one_or_none()

            if existing_gb:
                logger.info(f"Updating GoogleBusinessAccount {existing_gb.id}")
                existing_gb.account_name = account_data["account_name"]
                existing_gb.social_account_id = social_account.id
                db.add(existing_gb)
                gb_account = existing_gb
            else:
                logger.info("Creating new GoogleBusinessAccount")
                gb_account = GoogleBusinessAccount(
                    user_id=user_id,
                    social_account_id=social_account.id,
                    account_id=account_data["account_id"],
                    account_name=account_data["account_name"]
                )
                db.add(gb_account)

            await db.commit()
            await db.refresh(gb_account)
            return gb_account

        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving Google Business Account: {e}")
            raise

    @staticmethod
    async def get_user_accounts(db: AsyncSession, user_id: int) -> List[GoogleBusinessAccount]:
        """Fetch all connected Google Business accounts for a user."""
        try:
            stmt = select(GoogleBusinessAccount).where(GoogleBusinessAccount.user_id == user_id)
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error fetching Google Business accounts for user {user_id}: {e}")
            raise

    @staticmethod
    async def get_account_by_id(db: AsyncSession, account_db_id: int) -> Optional[GoogleBusinessAccount]:
        """Get GoogleBusinessAccount by DB ID (and load its social account)."""
        try:
            stmt = select(GoogleBusinessAccount).where(GoogleBusinessAccount.id == account_db_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching GoogleBusinessAccount by ID {account_db_id}: {e}")
            raise

    @staticmethod
    async def save_locations(
        db: AsyncSession,
        user_id: int,
        account_db_id: int,
        locations_data: List[dict]
    ) -> List[GoogleBusinessLocation]:
        """Bulk create or update location entries under a Google Business account."""
        try:
            saved_locations = []
            for loc in locations_data:
                stmt = select(GoogleBusinessLocation).where(
                    and_(
                        GoogleBusinessLocation.account_id == account_db_id,
                        GoogleBusinessLocation.location_id == loc["location_id"]
                    )
                )
                result = await db.execute(stmt)
                existing_loc = result.scalar_one_or_none()

                if existing_loc:
                    existing_loc.location_name = loc["location_name"]
                    existing_loc.address = loc.get("address")
                    existing_loc.phone = loc.get("phone")
                    existing_loc.website = loc.get("website")
                    existing_loc.primary_category = loc.get("primary_category")
                    existing_loc.is_verified = loc.get("is_verified", False)
                    db.add(existing_loc)
                    saved_locations.append(existing_loc)
                else:
                    new_loc = GoogleBusinessLocation(
                        user_id=user_id,
                        account_id=account_db_id,
                        location_id=loc["location_id"],
                        location_name=loc["location_name"],
                        address=loc.get("address"),
                        phone=loc.get("phone"),
                        website=loc.get("website"),
                        primary_category=loc.get("primary_category"),
                        is_verified=loc.get("is_verified", False)
                    )
                    db.add(new_loc)
                    saved_locations.append(new_loc)

            await db.commit()
            return saved_locations
        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving Google Business locations: {e}")
            raise

    @staticmethod
    async def get_locations(db: AsyncSession, user_id: int) -> List[GoogleBusinessLocation]:
        """Fetch all stored locations for a user."""
        try:
            stmt = select(GoogleBusinessLocation).where(GoogleBusinessLocation.user_id == user_id)
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error fetching locations for user {user_id}: {e}")
            raise

    @staticmethod
    async def get_location_by_id(db: AsyncSession, location_db_id: int) -> Optional[GoogleBusinessLocation]:
        """Get GoogleBusinessLocation by DB ID."""
        try:
            stmt = select(GoogleBusinessLocation).where(GoogleBusinessLocation.id == location_db_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching location by ID {location_db_id}: {e}")
            raise

    @staticmethod
    async def save_reviews(
        db: AsyncSession,
        location_db_id: int,
        reviews_data: List[dict]
    ) -> List[GoogleBusinessReview]:
        """Bulk save customer reviews for a location."""
        try:
            saved_reviews = []
            for rev in reviews_data:
                stmt = select(GoogleBusinessReview).where(
                    and_(
                        GoogleBusinessReview.location_id == location_db_id,
                        GoogleBusinessReview.review_id == rev["review_id"]
                    )
                )
                result = await db.execute(stmt)
                existing_rev = result.scalar_one_or_none()

                created_dt = rev.get("review_created_at")
                if isinstance(created_dt, str):
                    try:
                        created_dt = datetime.fromisoformat(created_dt.replace("Z", "+00:00"))
                    except ValueError:
                        created_dt = datetime.utcnow()
                elif not isinstance(created_dt, datetime):
                    created_dt = datetime.utcnow()

                if existing_rev:
                    existing_rev.reviewer_name = rev["reviewer_name"]
                    existing_rev.reviewer_photo = rev.get("reviewer_photo")
                    existing_rev.rating = rev["rating"]
                    existing_rev.comment = rev.get("comment")
                    if "reply_comment" in rev:
                        existing_rev.reply_comment = rev["reply_comment"]
                        existing_rev.reply_submitted_at = rev.get("reply_submitted_at")
                    db.add(existing_rev)
                    saved_reviews.append(existing_rev)
                else:
                    new_rev = GoogleBusinessReview(
                        location_id=location_db_id,
                        review_id=rev["review_id"],
                        reviewer_name=rev["reviewer_name"],
                        reviewer_photo=rev.get("reviewer_photo"),
                        rating=rev["rating"],
                        comment=rev.get("comment"),
                        reply_comment=rev.get("reply_comment"),
                        reply_submitted_at=rev.get("reply_submitted_at"),
                        review_created_at=GoogleBusinessCRUD._to_utc_naive(created_dt)
                    )
                    db.add(new_rev)
                    saved_reviews.append(new_rev)

            await db.commit()
            return saved_reviews
        except Exception as e:
            await db.rollback()
            logger.error(f"Error saving Google Business reviews: {e}")
            raise

    @staticmethod
    async def get_reviews(
        db: AsyncSession,
        location_db_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[GoogleBusinessReview], int]:
        """Fetch stored reviews for a location with pagination."""
        try:
            count_stmt = select(func.count(GoogleBusinessReview.id)).where(
                GoogleBusinessReview.location_id == location_db_id
            )
            count_res = await db.execute(count_stmt)
            total = count_res.scalar() or 0

            stmt = (
                select(GoogleBusinessReview)
                .where(GoogleBusinessReview.location_id == location_db_id)
                .order_by(desc(GoogleBusinessReview.review_created_at))
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            return list(result.scalars().all()), total
        except Exception as e:
            logger.error(f"Error fetching reviews for location {location_db_id}: {e}")
            raise

    @staticmethod
    async def update_review_reply(
        db: AsyncSession,
        review_db_id: int,
        reply_comment: str,
        reply_submitted_at: datetime
    ) -> Optional[GoogleBusinessReview]:
        """Save reply details on a review record."""
        try:
            stmt = select(GoogleBusinessReview).where(GoogleBusinessReview.id == review_db_id)
            result = await db.execute(stmt)
            review = result.scalar_one_or_none()

            if review:
                review.reply_comment = reply_comment
                review.reply_submitted_at = GoogleBusinessCRUD._to_utc_naive(reply_submitted_at)
                db.add(review)
                await db.commit()
                await db.refresh(review)
            return review
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating review reply in DB: {e}")
            raise

    @staticmethod
    async def create_post(
        db: AsyncSession,
        location_db_id: int,
        summary: str,
        media_url: Optional[str] = None,
        action_type: str = "LEARN_MORE",
        action_url: Optional[str] = None
    ) -> GoogleBusinessPost:
        """Create a new local post record (in pending status)."""
        try:
            post = GoogleBusinessPost(
                location_id=location_db_id,
                summary=summary,
                media_url=media_url,
                action_type=action_type,
                action_url=action_url,
                status="pending"
            )
            db.add(post)
            await db.commit()
            await db.refresh(post)
            return post
        except Exception as e:
            await db.rollback()
            logger.error(f"Error creating local post in DB: {e}")
            raise

    @staticmethod
    async def update_post_status(
        db: AsyncSession,
        post_db_id: int,
        status: str,
        post_id: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Optional[GoogleBusinessPost]:
        """Update Google local post publish status."""
        try:
            stmt = select(GoogleBusinessPost).where(GoogleBusinessPost.id == post_db_id)
            result = await db.execute(stmt)
            post = result.scalar_one_or_none()

            if post:
                post.status = status
                if post_id:
                    post.post_id = post_id
                if error_message:
                    post.error_message = error_message
                db.add(post)
                await db.commit()
                await db.refresh(post)
            return post
        except Exception as e:
            await db.rollback()
            logger.error(f"Error updating post status in DB: {e}")
            raise

    @staticmethod
    async def get_posts(
        db: AsyncSession,
        location_db_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> Tuple[List[GoogleBusinessPost], int]:
        """Fetch published posts list for a location."""
        try:
            count_stmt = select(func.count(GoogleBusinessPost.id)).where(
                GoogleBusinessPost.location_id == location_db_id
            )
            count_res = await db.execute(count_stmt)
            total = count_res.scalar() or 0

            stmt = (
                select(GoogleBusinessPost)
                .where(GoogleBusinessPost.location_id == location_db_id)
                .order_by(desc(GoogleBusinessPost.created_at))
                .offset(skip)
                .limit(limit)
            )
            result = await db.execute(stmt)
            return list(result.scalars().all()), total
        except Exception as e:
            logger.error(f"Error fetching posts for location {location_db_id}: {e}")
            raise


google_business_crud = GoogleBusinessCRUD()
