from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from config.database import Base

class VoiceCommandLog(Base):
    __tablename__ = "voice_command_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    command_text = Column(Text, nullable=False)
    detected_intent = Column(String(100), nullable=True)
    action = Column(String(50), nullable=True)
    route = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    requires_confirmation = Column(Boolean, default=False)
    executed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
