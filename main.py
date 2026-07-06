"""
Gabay – Synagogue Management System

FastAPI application entry point.
Modules are loaded dynamically from the Module Registry based on ENABLED_MODULES.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Import all modules so their models are registered with SQLModel
# and their definitions are registered with the ModuleRegistry.
import app.modules.congregants.module  # noqa: F401
import app.modules.payments.module     # noqa: F401
import app.modules.aliyot.module       # noqa: F401
import app.modules.seating.module      # noqa: F401
import app.modules.azkarot.module      # noqa: F401
import app.modules.smachot.module      # noqa: F401
import app.modules.calendar.module     # noqa: F401
import app.modules.llm.module          # noqa: F401

# ── Import TenantConfig so its table is created by create_db_and_tables()
import app.core.tenant  # noqa: F401

from app.api.v1.config import router as config_router
from app.core.config import settings
from app.core.db import create_db_and_tables
from app.core.registry import registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables before the server starts accepting requests."""
    create_db_and_tables()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Gabay – Synagogue Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount config endpoint
app.include_router(config_router, prefix="/api/v1")

# ── Mount enabled module routers
for module in registry.get_enabled(settings.ENABLED_MODULES):
    app.include_router(module.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
