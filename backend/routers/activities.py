from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import (
    User, Child, Alert,
    SleepLog, TemperatureLog, DiaperLog, FeedingLog, CryingLog,
)
from routers.auth import get_current_user
from schemas import (
    SleepCreate, SleepResponse,
    TemperatureCreate, TemperatureResponse,
    DiaperCreate, DiaperResponse,
    FeedingCreate, FeedingResponse,
    CryingCreate, CryingResponse,
    ActivityDay,
)

router = APIRouter()


def _owned_child(child_id: int, current_user: User, db: Session) -> Child:
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.user_id == current_user.id,
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


def _fire_alert(db: Session, child_id: int, rule_name: str, message: str):
    existing = db.query(Alert).filter(
        Alert.child_id == child_id,
        Alert.rule_name == rule_name,
        Alert.is_active == True,
    ).first()
    if not existing:
        db.add(Alert(child_id=child_id, rule_name=rule_name, message=message))


@router.post("/activities/sleep", response_model=SleepResponse)
def log_sleep(
    data: SleepCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_child(data.child_id, current_user, db)
    if data.end_time <= data.start_time:
        raise HTTPException(status_code=422, detail="end_time must be after start_time")
    if (data.end_time - data.start_time).total_seconds() / 3600 > 24:
        raise HTTPException(status_code=422, detail="Sleep duration cannot exceed 24 hours")
    entry = SleepLog(child_id=data.child_id, start_time=data.start_time, end_time=data.end_time)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/activities/temperature", response_model=TemperatureResponse)
def log_temperature(
    data: TemperatureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_child(data.child_id, current_user, db)
    if not (34.0 <= data.value <= 42.0):
        raise HTTPException(status_code=422, detail="Temperature must be between 34.0 and 42.0 °C")
    entry = TemperatureLog(child_id=data.child_id, value=data.value)
    db.add(entry)
    db.flush()
    if data.value > 38.5:
        _fire_alert(
            db, data.child_id, "high_temperature",
            f"Temperature reading of {data.value}°C exceeds the 38.5°C threshold. "
            "Please monitor closely and consult a healthcare professional if it does not improve.",
        )
    else:
        db.query(Alert).filter(
            Alert.child_id == data.child_id,
            Alert.rule_name == "high_temperature",
            Alert.is_active == True,
        ).update({"is_active": False})
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/activities/diaper", response_model=DiaperResponse)
def log_diaper(
    data: DiaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_child(data.child_id, current_user, db)
    if not (1 <= data.count <= 20):
        raise HTTPException(status_code=422, detail="Diaper count must be between 1 and 20")
    entry = DiaperLog(child_id=data.child_id, count=data.count)
    db.add(entry)
    db.flush()
    if data.count > 10:
        _fire_alert(
            db, data.child_id, "excessive_diapers",
            f"{data.count} diaper changes logged, which exceeds the normal threshold. "
            "Consider consulting your pediatrician.",
        )
    else:
        db.query(Alert).filter(
            Alert.child_id == data.child_id,
            Alert.rule_name == "excessive_diapers",
            Alert.is_active == True,
        ).update({"is_active": False})
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/activities/feeding", response_model=FeedingResponse)
def log_feeding(
    data: FeedingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_child(data.child_id, current_user, db)
    if not (1 <= data.count <= 20):
        raise HTTPException(status_code=422, detail="Feeding count must be between 1 and 20")
    entry = FeedingLog(child_id=data.child_id, count=data.count)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.post("/activities/crying", response_model=CryingResponse)
def log_crying(
    data: CryingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_child(data.child_id, current_user, db)
    if not (1 <= data.duration_mins <= 300):
        raise HTTPException(status_code=422, detail="Crying duration must be between 1 and 300 minutes")
    entry = CryingLog(child_id=data.child_id, duration_mins=data.duration_mins)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/activities/{child_id}", response_model=ActivityDay)
def get_activities(
    child_id: int,
    date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_child(child_id, current_user, db)
    day_start = datetime.combine(date, time.min)
    day_end   = datetime.combine(date, time.max)

    return ActivityDay(
        sleep=db.query(SleepLog).filter(
            SleepLog.child_id == child_id,
            SleepLog.start_time >= day_start,
            SleepLog.start_time <= day_end,
        ).all(),
        temperature=db.query(TemperatureLog).filter(
            TemperatureLog.child_id == child_id,
            TemperatureLog.logged_at >= day_start,
            TemperatureLog.logged_at <= day_end,
        ).all(),
        diaper=db.query(DiaperLog).filter(
            DiaperLog.child_id == child_id,
            DiaperLog.logged_at >= day_start,
            DiaperLog.logged_at <= day_end,
        ).all(),
        feeding=db.query(FeedingLog).filter(
            FeedingLog.child_id == child_id,
            FeedingLog.logged_at >= day_start,
            FeedingLog.logged_at <= day_end,
        ).all(),
        crying=db.query(CryingLog).filter(
            CryingLog.child_id == child_id,
            CryingLog.logged_at >= day_start,
            CryingLog.logged_at <= day_end,
        ).all(),
    )