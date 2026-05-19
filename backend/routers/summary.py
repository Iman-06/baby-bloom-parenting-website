from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from database import get_db
from models import User, Child
from routers.auth import get_current_user
from schemas import DailySummaryResponse

router = APIRouter()

@router.get("/summary/{child_id}", response_model=DailySummaryResponse)
def get_daily_summary(child_id: int, date: date, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    child = db.query(Child).filter(Child.id == child_id, Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    query = text("""
        SELECT total_sleep_hours, avg_temperature, total_diapers, total_feedings, total_crying_mins
        FROM daily_summary 
        WHERE child_id = :child_id AND log_date = :date
    """)
    result = db.execute(query, {"child_id": child_id, "date": date}).fetchone()

    if result:
        # Using mappings for safer access in raw sql
        row = result._mapping
        has_data = row["total_sleep_hours"] or row["avg_temperature"] or row["total_diapers"] or row["total_feedings"] or row["total_crying_mins"]
        if has_data:
            text_summary = f"{child.name} had {row['total_sleep_hours'] or 0} hours of sleep, {row['total_feedings'] or 0} feedings, and {row['total_diapers'] or 0} diaper changes today. Seems like a busy day!"
            return {
                "child_id": child_id,
                "child_name": child.name,
                "log_date": date,
                "total_sleep_hours": row["total_sleep_hours"] or 0.0,
                "avg_temperature": row["avg_temperature"] or 0.0,
                "total_diapers": row["total_diapers"] or 0,
                "total_feedings": row["total_feedings"] or 0,
                "total_crying_mins": row["total_crying_mins"] or 0,
                "text": text_summary
            }

    return {
        "child_id": child_id,
        "child_name": child.name,
        "log_date": date,
        "total_sleep_hours": 0.0,
        "avg_temperature": 0.0,
        "total_diapers": 0,
        "total_feedings": 0,
        "total_crying_mins": 0,
        "text": "Summary unavailable — please log some activities first"
    }
