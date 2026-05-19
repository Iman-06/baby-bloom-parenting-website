import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class GenderEnum(str, enum.Enum):
    male   = "male"
    female = "female"
    other  = "other"


# ─── Existing models (unchanged) ─────────────────────────────

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name          = Column(String(255))
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    children      = relationship("Child", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")


class Child(Base):
    __tablename__ = "child"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    name          = Column(String(255), nullable=False)
    gender        = Column(Enum(GenderEnum), nullable=False)
    date_of_birth = Column(DateTime)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    user   = relationship("User", back_populates="children")
    alerts = relationship("Alert", back_populates="child")


class Alert(Base):
    __tablename__ = "alerts"

    id                = Column(Integer, primary_key=True, index=True)
    child_id          = Column(Integer, ForeignKey("child.id"), nullable=False)
    rule_name         = Column(String(255))
    message           = Column(Text)
    is_active         = Column(Boolean, default=True)
    notification_sent = Column(Boolean, default=False)
    triggered_at      = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="alerts")


# ─── Activity log models (new) ────────────────────────────────

class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id         = Column(Integer, primary_key=True, index=True)
    child_id   = Column(Integer, ForeignKey("child.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time   = Column(DateTime, nullable=False)
    logged_at  = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child")


class TemperatureLog(Base):
    __tablename__ = "temperature_logs"

    id        = Column(Integer, primary_key=True, index=True)
    child_id  = Column(Integer, ForeignKey("child.id"), nullable=False)
    value     = Column(Float, nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child")


class DiaperLog(Base):
    __tablename__ = "diaper_logs"

    id        = Column(Integer, primary_key=True, index=True)
    child_id  = Column(Integer, ForeignKey("child.id"), nullable=False)
    count     = Column(Integer, nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child")


class FeedingLog(Base):
    __tablename__ = "feeding_logs"

    id        = Column(Integer, primary_key=True, index=True)
    child_id  = Column(Integer, ForeignKey("child.id"), nullable=False)
    count     = Column(Integer, nullable=False)
    logged_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child")


class CryingLog(Base):
    __tablename__ = "crying_logs"

    id            = Column(Integer, primary_key=True, index=True)
    child_id      = Column(Integer, ForeignKey("child.id"), nullable=False)
    duration_mins = Column(Integer, nullable=False)
    logged_at     = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child")


# ─── Chat models (new) ────────────────────────────────────────

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    title      = Column(String(255), default="New Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    user     = relationship("User", back_populates="chat_sessions")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    role       = Column(Enum("user", "assistant"), nullable=False)
    content    = Column(Text, nullable=False)
    sent_at    = Column(DateTime(timezone=True), server_default=func.now())

    session = relationship("ChatSession", back_populates="messages")