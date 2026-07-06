"""
Backward-compatibility shim.

Routing is now handled dynamically by main.py via the Module Registry.
This file is kept for any legacy references.
"""

from fastapi import APIRouter

api_router = APIRouter()
