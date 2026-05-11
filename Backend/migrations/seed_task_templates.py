"""
Seed Task Templates
Populate task_templates table with default templates
"""

import logging
import sys
import os

# Add Backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from config.database import sync_engine

logger = logging.getLogger(__name__)


def seed_task_templates():
    """Seed task templates"""
    try:
        logger.info("🔄 Seeding task templates...")
        
        templates = [
            # Marketing Tasks
            {
                "title": "Post on Instagram",
                "description": "Create and publish engaging content on Instagram",
                "category": "marketing",
                "priority": "high",
                "points": 20,
                "estimated_minutes": 30,
                "requires_instagram": True,
            },
            {
                "title": "Respond to customer messages",
                "description": "Reply to customer inquiries on WhatsApp",
                "category": "engagement",
                "priority": "high",
                "points": 15,
                "estimated_minutes": 20,
                "requires_whatsapp": True,
            },
            {
                "title": "Update business hours",
                "description": "Ensure your business hours are up to date online",
                "category": "growth",
                "priority": "medium",
                "points": 10,
                "estimated_minutes": 10,
            },
            {
                "title": "Ask for customer reviews",
                "description": "Send review requests to recent customers",
                "category": "marketing",
                "priority": "high",
                "points": 15,
                "estimated_minutes": 15,
            },
            {
                "title": "Check Instagram analytics",
                "description": "Review your Instagram performance metrics",
                "category": "analytics",
                "priority": "medium",
                "points": 10,
                "estimated_minutes": 15,
                "requires_instagram": True,
            },
            {
                "title": "Create promotional offer",
                "description": "Design a special offer for your customers",
                "category": "marketing",
                "priority": "medium",
                "points": 15,
                "estimated_minutes": 25,
            },
            {
                "title": "Write blog post",
                "description": "Create valuable content for your website blog",
                "category": "content",
                "priority": "medium",
                "points": 25,
                "estimated_minutes": 45,
                "requires_website": True,
            },
            {
                "title": "Engage with followers",
                "description": "Like and comment on your followers' posts",
                "category": "engagement",
                "priority": "medium",
                "points": 10,
                "estimated_minutes": 15,
                "requires_instagram": True,
            },
            {
                "title": "Update product photos",
                "description": "Take and upload new photos of your products/services",
                "category": "content",
                "priority": "low",
                "points": 15,
                "estimated_minutes": 30,
            },
            {
                "title": "Plan content calendar",
                "description": "Schedule your content for the next week",
                "category": "content",
                "priority": "medium",
                "points": 20,
                "estimated_minutes": 30,
            },
            {
                "title": "Send WhatsApp broadcast",
                "description": "Share updates with your customer list",
                "category": "marketing",
                "priority": "medium",
                "points": 15,
                "estimated_minutes": 20,
                "requires_whatsapp": True,
            },
            {
                "title": "Optimize website SEO",
                "description": "Improve your website's search engine visibility",
                "category": "growth",
                "priority": "medium",
                "points": 20,
                "estimated_minutes": 40,
                "requires_website": True,
            },
            {
                "title": "Create Instagram Story",
                "description": "Share behind-the-scenes content on Stories",
                "category": "content",
                "priority": "high",
                "points": 15,
                "estimated_minutes": 15,
                "requires_instagram": True,
            },
            {
                "title": "Analyze competitor activity",
                "description": "Research what your competitors are doing",
                "category": "analytics",
                "priority": "low",
                "points": 15,
                "estimated_minutes": 30,
            },
            {
                "title": "Update business profile",
                "description": "Keep your business information current",
                "category": "growth",
                "priority": "low",
                "points": 10,
                "estimated_minutes": 15,
            },
        ]
        
        with sync_engine.connect() as conn:
            for template in templates:
                # Check if template already exists
                result = conn.execute(text("""
                    SELECT id FROM task_templates WHERE title = :title
                """), {"title": template["title"]})
                
                if result.fetchone():
                    logger.info(f"⏭️  Template already exists: {template['title']}")
                    continue
                
                # Insert template
                conn.execute(text("""
                    INSERT INTO task_templates (
                        title, description, category, priority, points, estimated_minutes,
                        requires_instagram, requires_whatsapp, requires_website, is_active
                    ) VALUES (
                        :title, :description, :category, :priority, :points, :estimated_minutes,
                        :requires_instagram, :requires_whatsapp, :requires_website, TRUE
                    )
                """), {
                    "title": template["title"],
                    "description": template.get("description"),
                    "category": template["category"],
                    "priority": template["priority"],
                    "points": template["points"],
                    "estimated_minutes": template["estimated_minutes"],
                    "requires_instagram": template.get("requires_instagram", False),
                    "requires_whatsapp": template.get("requires_whatsapp", False),
                    "requires_website": template.get("requires_website", False),
                })
                
                logger.info(f"✅ Created template: {template['title']}")
            
            conn.commit()
        
        logger.info("✅ Task templates seeded successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Task templates seeding failed: {e}")
        return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_task_templates()
