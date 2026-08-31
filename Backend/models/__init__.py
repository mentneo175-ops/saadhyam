# Models package
from models.user import User
from models.instagram import (
    SocialAccount,
    ScheduledPost,
    PostAnalytics,
    SocialPlatform,
    PostStatus,
)
from models.settings import UserSettings
from models.instagram_analytics import (
    InstagramBusinessAccount,
    AnalyticsSnapshot,
    PostAnalytics as InstagramPostAnalytics,
    ReelAnalytics,
    StoryAnalytics,
    AudienceInsights,
    AIRecommendation,
    GrowthPrediction,
    SyncHistory,
    NotificationLog,
)
from models.task_tracking import (
    DailyTask,
    GrowthMetric,
    TaskTemplate,
)
from models.notification import UserNotification
from models.influencer import Influencer

# YouTube Models
from models.youtube import (
    YouTubeChannel,
    YouTubeVideo,
    YouTubeAnalytics,
)

# Voice Agent Models
from models.voice_agent import (
    VoiceCampaign,
    VoiceContact,
    VoiceCall,
    VoiceLead,
    VoiceFollowUp,
    CampaignStatus,
    CallStatus,
    LeadStatus,
    Language
)

# B2B Chat Models
from models.chat import (
    ChatRoom,
    ChatMessage,
    ConnectionRequest,
)

# Google Business Profile Models
from models.google_business import (
    GoogleBusinessAccount,
    GoogleBusinessLocation,
    GoogleBusinessReview,
    GoogleBusinessPost,
)

# Voice Command Logs Model
from models.voice_command import VoiceCommandLog

# User API Keys and Plugins Models
from models.user_api_keys import UserAPIKeys
from models.plugins import Plugin, UserPlugin, PluginAnalytics, PluginCategory, PluginStatus

# Order Management Plugin Models
from models.order import (
    Order,
    OrderItem,
    OrderStatus,
    PaymentStatus,
)

# LinkedIn Store Solution Models
from models.linkedin import (
    LinkedInConnection,
    LinkedInPostHistory,
    LinkedInPostStatus,
)

__all__ = [
    "User",
    "SocialAccount",
    "ScheduledPost",
    "PostAnalytics",
    "SocialPlatform",
    "PostStatus",
    "UserSettings",
    "InstagramBusinessAccount",
    "AnalyticsSnapshot",
    "InstagramPostAnalytics",
    "ReelAnalytics",
    "StoryAnalytics",
    "AudienceInsights",
    "AIRecommendation",
    "GrowthPrediction",
    "SyncHistory",
    "NotificationLog",
    "DailyTask",
    "GrowthMetric",
    "TaskTemplate",
    "UserNotification",
    "Influencer",
    "YouTubeChannel",
    "YouTubeVideo",
    "YouTubeAnalytics",
    "VoiceCampaign",
    "VoiceContact",
    "VoiceCall",
    "VoiceLead",
    "VoiceFollowUp",
    "ChatRoom",
    "ChatMessage",
    "ConnectionRequest",
    "GoogleBusinessAccount",
    "GoogleBusinessLocation",
    "GoogleBusinessReview",
    "GoogleBusinessPost",
    "VoiceCommandLog",
    "UserAPIKeys",
    "Plugin",
    "UserPlugin",
    "PluginAnalytics",
    "PluginCategory",
    "PluginStatus",
    # Order Management
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentStatus",
    # LinkedIn
    "LinkedInConnection",
    "LinkedInPostHistory",
    "LinkedInPostStatus",
]
