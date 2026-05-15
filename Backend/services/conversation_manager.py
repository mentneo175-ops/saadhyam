"""
Conversation Manager Service
Manages conversation sessions, memory, and state for voice agent
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class ConversationSession:
    """Individual conversation session"""
    
    def __init__(self, session_id: str, campaign_context: Dict[str, Any]):
        self.session_id = session_id
        self.campaign_context = campaign_context
        self.conversation_history: List[Dict[str, str]] = []
        self.customer_info: Dict[str, Any] = {}
        self.sentiment_history: List[str] = []
        self.intent_history: List[str] = []
        self.lead_score = 50  # Start at neutral
        self.started_at = datetime.utcnow()
        self.last_activity = datetime.utcnow()
        self.is_active = True
        self.metadata: Dict[str, Any] = {}
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add message to conversation history"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.conversation_history.append(message)
        self.last_activity = datetime.utcnow()
    
    def update_sentiment(self, sentiment: str):
        """Update sentiment tracking"""
        self.sentiment_history.append(sentiment)
        
        # Adjust lead score based on sentiment
        if sentiment == "positive":
            self.lead_score = min(100, self.lead_score + 10)
        elif sentiment == "negative":
            self.lead_score = max(0, self.lead_score - 10)
    
    def update_intent(self, intent: str):
        """Update intent tracking"""
        self.intent_history.append(intent)
        
        # Adjust lead score based on intent
        if intent == "interested":
            self.lead_score = min(100, self.lead_score + 15)
        elif intent == "not_interested":
            self.lead_score = max(0, self.lead_score - 20)
        elif intent == "needs_info":
            self.lead_score = min(100, self.lead_score + 5)
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get conversation summary"""
        duration = (datetime.utcnow() - self.started_at).total_seconds()
        
        # Calculate dominant sentiment
        if self.sentiment_history:
            positive_count = self.sentiment_history.count("positive")
            negative_count = self.sentiment_history.count("negative")
            if positive_count > negative_count:
                dominant_sentiment = "positive"
            elif negative_count > positive_count:
                dominant_sentiment = "negative"
            else:
                dominant_sentiment = "neutral"
        else:
            dominant_sentiment = "neutral"
        
        # Calculate interest level
        if self.lead_score >= 70:
            interest_level = "high"
        elif self.lead_score >= 40:
            interest_level = "medium"
        else:
            interest_level = "low"
        
        return {
            "session_id": self.session_id,
            "duration": duration,
            "message_count": len(self.conversation_history),
            "lead_score": self.lead_score,
            "dominant_sentiment": dominant_sentiment,
            "interest_level": interest_level,
            "last_intent": self.intent_history[-1] if self.intent_history else "unknown",
            "is_active": self.is_active,
            "started_at": self.started_at.isoformat(),
            "last_activity": self.last_activity.isoformat()
        }
    
    def get_full_transcript(self) -> str:
        """Get full conversation transcript"""
        transcript_lines = []
        for msg in self.conversation_history:
            role = "Agent" if msg["role"] == "assistant" else "Customer"
            transcript_lines.append(f"{role}: {msg['content']}")
        return "\n".join(transcript_lines)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary"""
        return {
            "session_id": self.session_id,
            "campaign_context": self.campaign_context,
            "conversation_history": self.conversation_history,
            "customer_info": self.customer_info,
            "sentiment_history": self.sentiment_history,
            "intent_history": self.intent_history,
            "lead_score": self.lead_score,
            "started_at": self.started_at.isoformat(),
            "last_activity": self.last_activity.isoformat(),
            "is_active": self.is_active,
            "metadata": self.metadata
        }


class ConversationManager:
    """Manages all conversation sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, ConversationSession] = {}
        logger.info("✅ Conversation Manager initialized")
    
    def create_session(
        self,
        session_id: str,
        campaign_context: Dict[str, Any],
        customer_info: Optional[Dict[str, Any]] = None
    ) -> ConversationSession:
        """Create new conversation session"""
        session = ConversationSession(session_id, campaign_context)
        
        if customer_info:
            session.customer_info = customer_info
        
        self.sessions[session_id] = session
        logger.info(f"✅ Created conversation session: {session_id}")
        
        return session
    
    def get_session(self, session_id: str) -> Optional[ConversationSession]:
        """Get existing session"""
        return self.sessions.get(session_id)
    
    def get_or_create_session(
        self,
        session_id: str,
        campaign_context: Dict[str, Any],
        customer_info: Optional[Dict[str, Any]] = None
    ) -> ConversationSession:
        """Get existing session or create new one"""
        session = self.get_session(session_id)
        
        if not session:
            session = self.create_session(session_id, campaign_context, customer_info)
        
        return session
    
    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        sentiment: Optional[str] = None,
        intent: Optional[str] = None,
        metadata: Optional[Dict] = None
    ):
        """Add message to session"""
        session = self.get_session(session_id)
        
        if not session:
            logger.warning(f"⚠️ Session not found: {session_id}")
            return
        
        session.add_message(role, content, metadata)
        
        if sentiment:
            session.update_sentiment(sentiment)
        
        if intent:
            session.update_intent(intent)
    
    def end_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """End conversation session"""
        session = self.get_session(session_id)
        
        if not session:
            return None
        
        session.is_active = False
        summary = session.get_conversation_summary()
        
        logger.info(f"✅ Ended conversation session: {session_id}")
        
        return summary
    
    def get_session_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session summary"""
        session = self.get_session(session_id)
        
        if not session:
            return None
        
        return session.get_conversation_summary()
    
    def get_session_transcript(self, session_id: str) -> Optional[str]:
        """Get session transcript"""
        session = self.get_session(session_id)
        
        if not session:
            return None
        
        return session.get_full_transcript()
    
    def get_active_sessions(self) -> List[ConversationSession]:
        """Get all active sessions"""
        return [s for s in self.sessions.values() if s.is_active]
    
    def cleanup_inactive_sessions(self, max_age_hours: int = 24):
        """Clean up old inactive sessions"""
        now = datetime.utcnow()
        sessions_to_remove = []
        
        for session_id, session in self.sessions.items():
            if not session.is_active:
                age_hours = (now - session.last_activity).total_seconds() / 3600
                if age_hours > max_age_hours:
                    sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            del self.sessions[session_id]
            logger.info(f"🗑️ Cleaned up old session: {session_id}")
        
        return len(sessions_to_remove)
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get conversation statistics"""
        total_sessions = len(self.sessions)
        active_sessions = len(self.get_active_sessions())
        
        if total_sessions == 0:
            return {
                "total_sessions": 0,
                "active_sessions": 0,
                "avg_lead_score": 0,
                "avg_duration": 0,
                "avg_messages": 0
            }
        
        lead_scores = [s.lead_score for s in self.sessions.values()]
        durations = [(datetime.utcnow() - s.started_at).total_seconds() 
                     for s in self.sessions.values()]
        message_counts = [len(s.conversation_history) for s in self.sessions.values()]
        
        return {
            "total_sessions": total_sessions,
            "active_sessions": active_sessions,
            "avg_lead_score": sum(lead_scores) / len(lead_scores),
            "avg_duration": sum(durations) / len(durations),
            "avg_messages": sum(message_counts) / len(message_counts)
        }


# Singleton instance
conversation_manager = ConversationManager()
