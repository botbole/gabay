# Gabay – Synagogue Management System

A FastAPI-based backend for managing synagogue operations, with built-in LLM support for natural-language interaction.

## Project Structure

```
gabay/
├── main.py                        # FastAPI application entry point
├── requirements.txt
├── .env.example                   # Environment variable template
└── app/
    ├── core/
    │   ├── config.py              # Centralised settings (pydantic-settings)
    │   └── llm.py                 # LLM client factory (OpenAI-compatible)
    ├── api/
    │   ├── router.py              # Aggregates all sub-routers
    │   └── v1/
    │       ├── synagogue.py       # Synagogue operation endpoints
    │       └── llm.py             # Chat & action-dispatch endpoints
    ├── models/
    │   └── base.py                # Shared Pydantic models / response envelopes
    └── services/
        ├── synagogue_service.py   # Synagogue business logic
        └── llm_service.py         # LLM chat + intent-routing service
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# edit .env and add your LLM_API_KEY

# 3. Run the development server
python main.py
# or
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/synagogue/info` | Synagogue info & supported operations |
| POST | `/api/v1/llm/chat` | Free-form chat with the Gabay assistant |
| POST | `/api/v1/llm/action` | Natural-language action dispatch |

## LLM Configuration

Set the following in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | Provider tag (informational) |
| `LLM_MODEL` | `gpt-4o` | Model name |
| `LLM_API_KEY` | _(empty)_ | API key |
| `LLM_BASE_URL` | _(empty)_ | Custom endpoint (Azure / Ollama) |
| `LLM_TEMPERATURE` | `0.2` | Sampling temperature |

## Next Steps

- Define concrete synagogue operations (prayer times, members, seats, donations, events)
- Implement the service layer for each operation
- Add a database layer (SQLAlchemy / SQLModel recommended)
- Build the React frontend
- Expand the LLM action registry as new features are added
