import os
from groq import Groq
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import User, ChatSession, ChatMessage
from routers.auth import get_current_user
from schemas import ChatRequest, ChatResponse, SessionWithMessages

router = APIRouter()

_groq_client = None

def get_groq() -> Groq:
    global _groq_client
    if _groq_client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")
        _groq_client = Groq(api_key=api_key)
    return _groq_client


SYSTEM_PROMPT = """You are BabyBloom Assistant, a warm and knowledgeable AI companion for new parents.

You have deep knowledge of infant development milestones. Reference these when relevant:

DEVELOPMENTAL MILESTONES:
- 1 month:  Focuses on faces, startles to sounds, makes small fist
- 2 months: Smiles socially, follows objects with eyes, holds head up briefly
- 3 months: LIMITED VISION — cannot see clearly yet. Discovers hands, coos and gurgles
- 4 months: Laughs, holds head steady, pushes up on arms during tummy time
- 6 months: VISION SIGNIFICANTLY IMPROVES — starts seeing well! Sits with support, rolls both ways, may start solids, babbles
- 7 months: Sits without support, responds to own name, object permanence
- 9 months: PULLS TO STAND, crawls, waves bye-bye, pincer grasp, says mama/dada
- 12 months: BEGINS WALKING (first steps!), says 1–3 words, points to objects, drinks from cup
- 15 months: Walks steadily, stacks 2 blocks, follows simple instructions
- 18 months: Runs, says 10+ words, feeds self with spoon

When parents mention their baby's age, proactively mention the current and upcoming milestones.

Also help with:
- Sleep schedules and safe sleep (back-to-sleep, no loose bedding)
- Feeding (breastfeeding, formula, introducing solids at 6 months)
- Fever management (38°C+ in infants needs medical attention)
- Normal diaper frequency by age
- Soothing a crying baby (5 S's: Swaddle, Side/Stomach position, Shush, Swing, Suck)
- Postpartum parent wellbeing

Keep responses warm, concise, and reassuring. Never diagnose.
Always end with: "This is general guidance only and not medical advice. When in doubt, consult your pediatrician."
"""


@router.post("/chat", response_model=ChatResponse)
def send_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    groq = get_groq()

    if req.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == req.session_id,
            ChatSession.user_id == current_user.id,
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        words = req.message.split()
        title = " ".join(words[:6]) + ("…" if len(words) > 6 else "")
        session = ChatSession(user_id=current_user.id, title=title)
        db.add(session)
        db.commit()
        db.refresh(session)

    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.sent_at).all()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    try:
        completion = groq.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        reply_text = completion.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI service error: {str(e)}")

    db.add(ChatMessage(session_id=session.id, role="user",      content=req.message))
    db.add(ChatMessage(session_id=session.id, role="assistant", content=reply_text))
    db.commit()

    return ChatResponse(
        session_id=session.id,
        reply=reply_text,
        session_title=session.title,
    )


@router.get("/chat/history/{user_id}", response_model=list[SessionWithMessages])
def get_chat_history(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.created_at.desc())
        .all()
    )
    return sessions