"""
Shared base Pydantic models and response envelopes.
Domain-specific models will be added as synagogue features are defined.
"""

from pydantic import BaseModel


class APIResponse(BaseModel):
    """Standard JSON envelope for all API responses."""

    success: bool = True
    message: str = "ok"
    data: dict | list | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: str | None = None
