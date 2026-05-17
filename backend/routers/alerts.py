from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Child, Alert
from routers.auth import get_current_user
from schemas import AlertResponse

router = APIRouter()

@router.get("/alerts/{child_id}", response_model=List[AlertResponse])
def get_alerts(child_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    child = db.query(Child).filter(Child.id == child_id, Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    alerts = db.query(Alert).filter(Alert.child_id == child_id, Alert.is_active == True).all()
    return alerts
