from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional


# ─── Existing schemas (unchanged) ────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ChildCreate(BaseModel):
    name: str
    gender: str
    date_of_birth: date

class ChildResponse(BaseModel):
    id: int
    user_id: int
    name: str
    gender: str
    date_of_birth: date
    created_at: datetime

    class Config:
        from_attributes = True

class AlertResponse(BaseModel):
    id: int
    child_id: int
    rule_name: str
    message: str
    is_active: bool
    notification_sent: bool
    triggered_at: datetime

    class Config:
        from_attributes = True

class DailySummaryResponse(BaseModel):
    child_id: int
    child_name: str
    log_date: date
    total_sleep_hours: float
    avg_temperature: float
    total_diapers: int
    total_feedings: int
    total_crying_mins: int
    text: str = ""

    class Config:
        from_attributes = True


# ─── Activity schemas (new) ───────────────────────────────────

class SleepCreate(BaseModel):
    child_id: int
    start_time: datetime
    end_time: datetime

class SleepResponse(BaseModel):
    id: int
    child_id: int
    start_time: datetime
    end_time: datetime
    logged_at: datetime

    class Config:
        from_attributes = True


class TemperatureCreate(BaseModel):
    child_id: int
    value: float

class TemperatureResponse(BaseModel):
    id: int
    child_id: int
    value: float
    logged_at: datetime

    class Config:
        from_attributes = True


class DiaperCreate(BaseModel):
    child_id: int
    count: int

class DiaperResponse(BaseModel):
    id: int
    child_id: int
    count: int
    logged_at: datetime

    class Config:
        from_attributes = True


class FeedingCreate(BaseModel):
    child_id: int
    count: int

class FeedingResponse(BaseModel):
    id: int
    child_id: int
    count: int
    logged_at: datetime

    class Config:
        from_attributes = True


class CryingCreate(BaseModel):
    child_id: int
    duration_mins: int

class CryingResponse(BaseModel):
    id: int
    child_id: int
    duration_mins: int
    logged_at: datetime

    class Config:
        from_attributes = True


class ActivityDay(BaseModel):
    sleep:       list[SleepResponse]       = []
    temperature: list[TemperatureResponse] = []
    diaper:      list[DiaperResponse]      = []
    feeding:     list[FeedingResponse]     = []
    crying:      list[CryingResponse]      = []


# ─── Chat schemas (new) ───────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None

class MessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    session_id: int
    reply: str
    session_title: str

class SessionWithMessages(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: list[MessageOut] = []

    class Config:
        from_attributes = True