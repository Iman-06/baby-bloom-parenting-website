from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Child, User
from schemas import ChildCreate, ChildResponse
from routers.auth import get_current_user

router = APIRouter()

@router.get("/child", response_model=ChildResponse)
def get_child(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    child = db.query(Child).filter(Child.user_id == current_user.id).first()
    if not child:
        raise HTTPException(status_code=404, detail="No child profile found")
    return child

@router.post("/child", response_model=ChildResponse)
def create_child(child_data: ChildCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(Child).filter(Child.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already has a child profile")
    
    new_child = Child(
        user_id=current_user.id,
        name=child_data.name,
        gender=child_data.gender,
        date_of_birth=child_data.date_of_birth
    )
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    return new_child
