"""
Top-level API router – aggregates all v1 sub-routers.
Add new routers here as synagogue features are implemented.
"""

from fastapi import APIRouter

from app.api.v1 import llm, synagogue

api_router = APIRouter()
api_router.include_router(synagogue.router)
api_router.include_router(llm.router)
