from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import get_db
from app.domain.schemas import HealthResponseSchema
from app.domain.models import EmergencyCaseModel
from app.init_db import init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.cases import router as cases_router
from app.api.v1.vitals import router as vitals_router
from app.api.v1.interventions import router as interventions_router
from app.api.v1.clinicians import router as clinicians_router
from app.api.v1.facilities import router as facilities_router
from app.api.v1.events import router as events_router
from app.api.v1.websocket import router as websocket_router
from app.api.v1.ai import router as ai_router, ai_status_router
from app.api.v1.handover import router as handover_router
from app.api.v1.intake import router as intake_router
from app.realtime.manager import realtime_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed 3 competition scenarios on startup
    init_db()
    import asyncio
    realtime_manager.loop = asyncio.get_running_loop()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PRANA High-Reliability Prehospital Emergency Coordination and Tele-Specialist Intelligence Platform Backend.",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Enable CORS for local Vite development & multi-role browser tabs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Health & Readiness Endpoint
@app.get("/health", response_model=HealthResponseSchema, tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """
    Service health check: verifies database connection, returns count of persistent cases,
    and exposes active real-time WebSocket connection metrics.
    """
    db.execute(text("SELECT 1"))
    case_count = db.query(EmergencyCaseModel).count()
    return HealthResponseSchema(
        status="ok",
        version=settings.VERSION,
        database="connected",
        active_cases=case_count,
        realtime={
            "status": "active",
            "active_connections": realtime_manager.get_connection_count(),
            "active_case_channels": len(realtime_manager.get_active_cases())
        }
    )

# Include v1 API Routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(cases_router, prefix=settings.API_V1_PREFIX)
app.include_router(vitals_router, prefix=settings.API_V1_PREFIX)
app.include_router(interventions_router, prefix=settings.API_V1_PREFIX)
app.include_router(clinicians_router, prefix=settings.API_V1_PREFIX)
app.include_router(facilities_router, prefix=settings.API_V1_PREFIX)
app.include_router(events_router, prefix=settings.API_V1_PREFIX)
app.include_router(websocket_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_status_router, prefix=settings.API_V1_PREFIX)
app.include_router(handover_router, prefix=settings.API_V1_PREFIX)
app.include_router(intake_router, prefix=settings.API_V1_PREFIX)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
