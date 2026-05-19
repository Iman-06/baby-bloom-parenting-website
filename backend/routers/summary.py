from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from database import get_db
from models import User, Child
from routers.auth import get_current_user
from schemas import DailySummaryResponse, ChartsResponse, WeeklyDataPoint, MonthlyDataPoint
import datetime

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
        # Fetch latest times for the child across all dates
        last_times = db.execute(text("""
            SELECT 
                (SELECT MAX(end_time) FROM sleep_logs WHERE child_id = :child_id) as last_sleep,
                (SELECT MAX(logged_at) FROM temperature_logs WHERE child_id = :child_id) as last_temp,
                (SELECT MAX(logged_at) FROM diaper_logs WHERE child_id = :child_id) as last_diaper,
                (SELECT MAX(logged_at) FROM feeding_logs WHERE child_id = :child_id) as last_feeding
        """), {"child_id": child_id}).fetchone()
        lt = last_times._mapping if last_times else {}

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
                "last_sleep_time": lt.get("last_sleep"),
                "last_temperature_time": lt.get("last_temp"),
                "last_diaper_time": lt.get("last_diaper"),
                "last_feeding_time": lt.get("last_feeding"),
                "text": text_summary
            }

    return {
        "child_id": child_id,
        "child_name": child.name,
        "log_date": date,
        "total_sleep_hours": 0.0,
        "avg_temperature": 0.0,
        "total_diapers": 0,
        "total_crying_mins": 0,
        "text": "Summary unavailable — please log some activities first"
    }

@router.get("/charts/{child_id}", response_model=ChartsResponse)
def get_charts_data(child_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    child = db.query(Child).filter(Child.id == child_id, Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Fetch last 7 days of daily_summary
    daily_res = db.execute(text("""
        SELECT log_date, total_sleep_hours, total_feedings, total_diapers 
        FROM daily_summary 
        WHERE child_id = :child_id 
        ORDER BY log_date DESC LIMIT 7
    """), {"child_id": child_id}).fetchall()
    
    weekly_data = []
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for row in reversed(daily_res):
        r = row._mapping
        d = r["log_date"]
        # log_date is a date object
        day_str = days[d.weekday()] if isinstance(d, datetime.date) else "Day"
        weekly_data.append(WeeklyDataPoint(
            day=day_str,
            sleep=r["total_sleep_hours"] or 0,
            feedings=r["total_feedings"] or 0,
            diapers=r["total_diapers"] or 0
        ))

    # Fetch last 4 weeks of weekly_summary
    weekly_res = db.execute(text("""
        SELECT week, avg_sleep_hours, total_feedings, total_diapers 
        FROM weekly_summary 
        WHERE child_id = :child_id 
        ORDER BY week DESC LIMIT 4
    """), {"child_id": child_id}).fetchall()
    
    monthly_data = []
    for idx, row in enumerate(reversed(weekly_res)):
        r = row._mapping
        monthly_data.append(MonthlyDataPoint(
            week=f"Week {idx+1}",
            sleep=r["avg_sleep_hours"] or 0,
            feedings=r["total_feedings"] or 0,
            diapers=r["total_diapers"] or 0
        ))

    # Fallback to dummy data structure if no data
    if not weekly_data:
        weekly_data = [WeeklyDataPoint(day="Mon", sleep=0, feedings=0, diapers=0)]
    if not monthly_data:
        monthly_data = [MonthlyDataPoint(week="Week 1", sleep=0, feedings=0, diapers=0)]

    return ChartsResponse(weekly=weekly_data, monthly=monthly_data)
