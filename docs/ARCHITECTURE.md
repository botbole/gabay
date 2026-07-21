# Gabay Architecture Guide

This document describes the modular architecture of the Gabay Synagogue Management System.

---

## 1. Full System Overview

The entire platform — web, mobile, backend, and AI — in one diagram.

```mermaid
graph TD
    subgraph Clients [Clients]
        Browser[Web Browser - React SPA]
        Mobile[Mobile App - React Native
Android + iOS - Future]
    end

    subgraph Backend [Backend - FastAPI - Python]
        Main[main.py]
        Registry[Module Registry]
        Bus[Event Bus]

        subgraph Core [Core - app/core/]
            DB[(SQLite / PostgreSQL)]
            Auth[JWT Auth - v3.0]
            TenantCfg[Tenant Config]
            HebDate[Hebrew Date - pyluach]
        end

        subgraph Modules [Pluggable Modules - app/modules/]
            MOD_C[congregants]
            MOD_P[payments]
            MOD_A[aliyot]
            MOD_S[seating]
            MOD_CAL[calendar]
            MOD_LLM[llm - Digital Gabbai]
            MOD_WA[whatsapp - Future]
        end

        Main --> Registry
        Registry -->|loads enabled modules| Modules
        Modules --> DB
        Modules -.->|fire| Bus
        Bus -.->|notify| Modules
    end

    subgraph External [External Services]
        OpenAI[OpenAI / Azure / Ollama]
        WhatsAppAPI[WhatsApp Business API]
        HebCal[Hebcal API - zmanim]
        FCM[Firebase - Push]
    end

    Browser -->|REST /api/v1| Backend
    Mobile -->|REST /api/v1| Backend
    TenantCfg -->|JSON Manifest| Browser
    TenantCfg -->|JSON Manifest| Mobile
    MOD_LLM --> OpenAI
    MOD_WA --> WhatsAppAPI
    MOD_CAL --> HebCal
    FCM --> Mobile
```

---

## 2. Module Internal Structure

Every module follows the same internal layout. No module may import from another module.

```mermaid
graph LR
    subgraph mod [app/modules/payments/]
        meta[module.py
name, router, llm_tools]
        api[api.py
FastAPI Router
Request Schemas]
        svc[service.py
Business Logic]
        mdl[models.py
SQLModel Tables]
    end

    subgraph core [app/core/]
        db[(Database)]
        bus[Event Bus]
        registry[Registry]
    end

    registry -->|imports router from| meta
    api --> svc
    svc --> mdl
    mdl --> db
    svc -.->|fire events| bus
```

**Isolation Rules:**
- `api.py` → calls `service.py` only, never DB directly
- `service.py` → owns its `models.py`, fires events on the Bus
- Cross-module references are **soft** (plain string ID, no DB foreign key)

---

## 3. Request Lifecycle

How a single API call flows through the system.

```mermaid
sequenceDiagram
    participant C as Client (Browser / Mobile)
    participant MW as FastAPI Middleware
    participant R as Router (api.py)
    participant S as Service (service.py)
    participant DB as Database
    participant Bus as Event Bus

    C->>MW: POST /api/v1/payments
    MW->>MW: Validate JWT
    MW->>R: route to record_payment()
    R->>R: Validate request schema
    R->>S: service.record_payment(...)
    S->>DB: INSERT into payments
    DB-->>S: new Payment record
    S->>Bus: fire("payment.recorded", amount, congregant_id)
    Bus-->>S: (listeners notified async)
    S-->>R: return payment dict
    R-->>C: { success: true, data: {...} }
```

---

## 4. Event Bus (Hook System)

Modules communicate only through events. No direct imports between modules.

```mermaid
sequenceDiagram
    participant CongSvc as Congregants Service
    participant Bus as Event Bus
    participant PaySvc as Payments Service
    participant SeatSvc as Seating Service
    participant WASvc as WhatsApp Service

    CongSvc->>Bus: fire("congregant.archived", id=...)
    Bus->>PaySvc: on_congregant_archived()
    Bus->>SeatSvc: on_congregant_archived() - free seat
    Bus->>WASvc: on_congregant_archived() - notify
    Note over CongSvc: Does not know about
Payments, Seating, or WhatsApp
```

**Core Events Table:**

| Event | Fired By | Example Listeners |
|---|---|---|
| `congregant.created` | congregants | payments (create dues invoice) |
| `congregant.archived` | congregants | seating (free up seat), whatsapp |
| `payment.recorded` | payments | llm (update summary context) |
| `aliya.assigned` | aliyot | payments (auto-record donation) |
| `azkara.approaching` | calendar | whatsapp (D-7 and D-1 reminders) |
| `bulletin.building` | bulletin | all modules (inject weekly content) |

---

## 5. Deployment Architecture

One Docker image, many synagogues — each with its own enabled modules and branding.

```mermaid
graph TD
    Git[Git Repository] -->|CI/CD| Image[Docker Image
gabay:latest]

    Image -->|docker-compose| DevEnv[Dev Environment
All modules enabled]

    Image -->|K8s deploy| SynA
    Image -->|K8s deploy| SynB
    Image -->|K8s deploy| SynC

    subgraph SynA [Synagogue A - Basic]
        EnvA[ENABLED_MODULES=
congregants,payments,calendar]
    end

    subgraph SynB [Synagogue B - Premium]
        EnvB[ENABLED_MODULES=
congregants,payments,
aliyot,seating,llm,whatsapp]
    end

    subgraph SynC [Synagogue C - Custom]
        EnvC[ENABLED_MODULES=
congregants,calendar,bulletin]
    end
```

**How the Registry uses `ENABLED_MODULES`:**
1. `main.py` imports every `app/modules/<name>/module.py` at startup
2. Each `module.py` calls `registry.register(ModuleDefinition(...))` — self-registration
3. `main.py` then calls `registry.get_enabled(settings.ENABLED_MODULES)`
4. If enabled: the module's router is mounted under `/api/v1`
5. If disabled: the module is completely skipped — no routes, no AI tools

---

## 6. Frontend Dynamic Loading

```mermaid
sequenceDiagram
    participant App as React App
    participant API as Backend /config
    participant Sidebar as Sidebar Component
    participant Router as React Router

    App->>API: GET /api/v1/config
    API-->>App: { modules: [...], theme: {...} }
    App->>App: Store manifest in ConfigContext
    App->>Sidebar: pass enabled modules list
    Sidebar->>Sidebar: render only enabled nav items
    App->>Router: register routes for enabled modules only
    App->>App: inject CSS variables from theme
```

---

## 7. Database Entity Relationship

All entities are linked to `Congregant` through a **soft ID** (string UUID). There are no cross-module foreign keys.

```mermaid
erDiagram
    CONGREGANTS {
        string id PK
        string first_name
        string last_name
        string hebrew_name
        string phone
        string email
        string member_type
        bool   is_kohen
        bool   is_levi
        bool   is_archived
        string join_date
    }

    PAYMENTS {
        string id PK
        string congregant_id FK
        float  amount
        string currency
        string purpose
        string date
    }

    ALIYOT {
        string id PK
        string congregant_id FK
        string parasha
        string aliya_type
        string date
        float  donation_amount
    }

    PLACES {
        string id PK
        string congregant_id FK
        string section
        string row
        int    place_number
        bool   is_reserved
        float  annual_fee
    }

    AZKAROT {
        string id PK
        string congregant_id FK
        string deceased_name
        string relation
        int    hebrew_day
        int    hebrew_month
        string gregorian_date
    }

    SMACHOT {
        string id PK
        string congregant_id FK
        string occasion_type
        string description
        int    hebrew_day
        int    hebrew_month
        string gregorian_date
        string parasha
    }

    CONGREGANTS ||--o{ PAYMENTS  : "makes"
    CONGREGANTS ||--o{ ALIYOT    : "receives"
    CONGREGANTS ||--o| PLACES    : "assigned to"
    CONGREGANTS ||--o{ AZKAROT   : "commemorates"
    CONGREGANTS ||--o{ SMACHOT   : "celebrates"
```

---

## 8. Key Design Decisions

| Decision | Reason |
|---|---|
| Modular Monolith over Microservices | Lower operational complexity. Can migrate to microservices later if needed. |
| Soft IDs over DB Foreign Keys | Allows modules to be removed or added without DB migrations or cascade errors. |
| Event Bus over direct imports | Zero coupling — adding a WhatsApp module does not touch the Congregants module. |
| Single Docker image + ENV toggle | Simple CI/CD pipeline; monetization is config, not separate builds. |
| Dynamic LLM tools | Disabled modules are completely invisible to the AI assistant. |
| React Native for Mobile | Reuses 90% of existing API layer; single codebase for Android and iOS. |
