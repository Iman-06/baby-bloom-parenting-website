from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, children, alerts, summary, activities, chat

app = FastAPI(title="Baby Bloom API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,       prefix="/api/v1")
app.include_router(children.router,   prefix="/api/v1")
app.include_router(alerts.router,     prefix="/api/v1")
app.include_router(summary.router,    prefix="/api/v1")
app.include_router(activities.router, prefix="/api/v1")
app.include_router(chat.router,       prefix="/api/v1")