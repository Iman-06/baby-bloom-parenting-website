import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    children = relationship("Child", back_populates="user")

class Child(Base):
    __tablename__ = "child"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    gender = Column(Enum(GenderEnum), nullable=False)
    date_of_birth = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="children")
    alerts = relationship("Alert", back_populates="child")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("child.id"), nullable=False)
    rule_name = Column(String(255))
    message = Column(Text)
    is_active = Column(Boolean, default=True)
    notification_sent = Column(Boolean, default=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())

    child = relationship("Child", back_populates="alerts")
