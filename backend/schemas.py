from pydantic import BaseModel
from datetime import datetime, date

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
