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


def check_and_create_alerts(db: Session, child_id: int):
    """Check various conditions and create alerts if needed"""
    
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        return
    
    # Get today's data
    today = datetime.now().date()
    today_start = datetime.combine(today, time.min)
    today_end = datetime.combine(today, time.max)
    
    # Check temperature (low temperature - below 36°C)
    temp_today = db.query(TemperatureLog).filter(
        TemperatureLog.child_id == child_id,
        TemperatureLog.logged_at >= today_start,
        TemperatureLog.logged_at <= today_end
    ).order_by(TemperatureLog.logged_at.desc()).first()
    
    if temp_today:
        if temp_today.value < 36.0:
            _fire_alert(
                db, child_id, "low_temperature",
                f"⚠️ Low temperature: {temp_today.value}°C is below normal range (36-37.5°C). Please keep {child.name} warm and monitor closely."
            )
            # Resolve high temperature alert if exists
            db.query(Alert).filter(
                Alert.child_id == child_id,
                Alert.rule_name == "high_temperature",
                Alert.is_active == True,
            ).update({"is_active": False})
        elif temp_today.value > 38.5:
            _fire_alert(
                db, child_id, "high_temperature",
                f"⚠️ High temperature: {temp_today.value}°C exceeds 38.5°C threshold. Please monitor closely."
            )
            # Resolve low temperature alert if exists
            db.query(Alert).filter(
                Alert.child_id == child_id,
                Alert.rule_name == "low_temperature",
                Alert.is_active == True,
            ).update({"is_active": False})
        else:
            # Resolve both temperature alerts if temperature is normal
            db.query(Alert).filter(
                Alert.child_id == child_id,
                Alert.rule_name.in_(["high_temperature", "low_temperature"]),
                Alert.is_active == True,
            ).update({"is_active": False})
    
    # Check diapers (zero diaper changes)
    diaper_count_today = db.query(DiaperLog).filter(
        DiaperLog.child_id == child_id,
        DiaperLog.logged_at >= today_start,
        DiaperLog.logged_at <= today_end
    ).count()
    
    if diaper_count_today == 0:
        _fire_alert(
            db, child_id, "zero_diapers",
            f"⚠️ No diaper changes logged today for {child.name}. Please check and log diaper changes to monitor hydration."
        )
        # Resolve excessive diapers alert if exists
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name == "excessive_diapers",
            Alert.is_active == True,
        ).update({"is_active": False})
    elif diaper_count_today > 10:
        _fire_alert(
            db, child_id, "excessive_diapers",
            f"⚠️ {diaper_count_today} diaper changes today exceeds normal threshold."
        )
        # Resolve zero diapers alert if exists
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name == "zero_diapers",
            Alert.is_active == True,
        ).update({"is_active": False})
    else:
        # Resolve both diaper alerts
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name.in_(["zero_diapers", "excessive_diapers"]),
            Alert.is_active == True,
        ).update({"is_active": False})
    
    # Check feedings (zero feedings)
    feeding_count_today = db.query(FeedingLog).filter(
        FeedingLog.child_id == child_id,
        FeedingLog.logged_at >= today_start,
        FeedingLog.logged_at <= today_end
    ).count()
    
    if feeding_count_today == 0:
        _fire_alert(
            db, child_id, "zero_feedings",
            f"⚠️ No feeding sessions logged today for {child.name}. Regular feeding is important for growth."
        )
    else:
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name == "zero_feedings",
            Alert.is_active == True,
        ).update({"is_active": False})
    
    # Check crying (prolonged crying - more than 60 minutes)
    crying_today = db.query(CryingLog).filter(
        CryingLog.child_id == child_id,
        CryingLog.logged_at >= today_start,
        CryingLog.logged_at <= today_end
    ).all()
    
    total_crying = sum(c.duration_mins for c in crying_today)
    
    if total_crying > 120:
        _fire_alert(
            db, child_id, "excessive_crying_severe",
            f"⚠️ {child.name} has been crying for {total_crying} minutes today. Please check for signs of illness or discomfort."
        )
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name == "excessive_crying",
            Alert.is_active == True,
        ).update({"is_active": False})
    elif total_crying > 60:
        _fire_alert(
            db, child_id, "excessive_crying",
            f"⚠️ {child.name} has been crying for {total_crying} minutes today. Please check for hunger, tiredness, or discomfort."
        )
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name == "excessive_crying_severe",
            Alert.is_active == True,
        ).update({"is_active": False})
    else:
        db.query(Alert).filter(
            Alert.child_id == child_id,
            Alert.rule_name.in_(["excessive_crying", "excessive_crying_severe"]),
            Alert.is_active == True,
        ).update({"is_active": False})
    
    db.commit()


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
    # Check alerts after logging
    check_and_create_alerts(db, data.child_id)
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
    db.commit()
    db.refresh(entry)
    # Check alerts after logging
    check_and_create_alerts(db, data.child_id)
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
    db.commit()
    db.refresh(entry)
    # Check alerts after logging
    check_and_create_alerts(db, data.child_id)
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
    # Check alerts after logging
    check_and_create_alerts(db, data.child_id)
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
    # Check alerts after logging
    check_and_create_alerts(db, data.child_id)
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