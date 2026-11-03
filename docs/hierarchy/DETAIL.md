# Gabay file tree

Annotated tree of the project source. `node_modules/`, virtualenvs, `__pycache__`, `.pytest_cache`, `frontend/dist`, and `gabay.db` are omitted. High-level reading order is [`README.md`](README.md). What runs today is [`ARCHITECTURE.md`](ARCHITECTURE.md).

Legend: tracked files are in git unless marked local. Local means gitignored.

```text
gabay/
├── AGENTS.md                         # Canonical AI instructions. Single always-on rule file
├── CLAUDE.md                         # One line: @AGENTS.md
├── ROADMAP.md                        # English live status. Agents read this
├── CHANGELOG.md                      # Shipped slices
├── README.md                         # Human overview. Points at the target architecture
├── main.py                           # FastAPI entry. Imports every module, mounts enabled routers
├── requirements.txt
├── alembic.ini
├── pytest.ini
├── .env.example                      # Install-time settings template
├── .env                              # Local. Gitignored
├── .gitignore
├── server_out.txt / server_err.txt   # Local Uvicorn logs. Gitignored
│
├── .cursor/                          # Cursor project config. Tracked, except where noted
│   ├── mcp.json                      # Tracked. Keep secrets out of it
│   ├── agents/
│   │   ├── pm.md
│   │   ├── developer.md
│   │   ├── tester.md
│   │   └── reviewer.md
│   ├── rules/                        # Thin globs. Long text is docs/agent
│   │   ├── backend.mdc               # -> docs/agent/backend.md
│   │   ├── modern-ui.mdc             # -> docs/agent/frontend.md
│   │   ├── prayer-schedule.mdc       # -> docs/agent/prayer-schedule.md
│   │   └── domain-gotchas.mdc        # -> docs/agent/domain-gotchas.md
│   ├── skills/
│   │   ├── modern-ui/
│   │   │   ├── SKILL.md              # Own palette text, plus a pointer to docs/agent/frontend.md
│   │   │   └── examples.md           # Sample JSX that does not follow the current UI rules
│   │   └── run-phase/
│   │       └── SKILL.md              # /run-phase checklist
│   └── plans/
│       └── warm_heritage_frontend_final_8497efef.plan.md
│
├── .claude/                          # Local. Gitignored. settings.json, settings.local.json
├── .codex/                           # Local. Gitignored. hooks.json and skills/graphify/
├── graphify-out/                     # Local generated index. Gitignored
│
├── docs/
│   ├── ARCHITECTURE.md               # Target design
│   ├── ROADMAP_HE.md                 # Hebrew history. Agents skip unless asked
│   ├── PRD_GABAY.md                  # English product spec. Agents skip unless asked
│   ├── PRD_GABAY_HE.md               # Hebrew product spec. Agents skip unless asked
│   ├── hierarchy/
│   │   ├── README.md                 # High-level map
│   │   ├── DETAIL.md                 # This file
│   │   └── ARCHITECTURE.md           # Current runtime
│   ├── agent/
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   ├── prayer-schedule.md
│   │   └── domain-gotchas.md
│   └── product/
│       ├── WORKFLOW.md
│       ├── BACKLOG.md
│       ├── DECISIONS.md
│       └── specs/
│           ├── _TEMPLATE.md
│           ├── aliyot.md
│           ├── auth.md
│           ├── azkarot.md
│           ├── calendar.md
│           ├── congregants.md
│           ├── dashboard.md
│           ├── llm-assistant.md
│           ├── payments.md
│           ├── prayer-schedule.md
│           ├── seating.md
│           ├── smachot.md
│           ├── weekly-bulletin.md    # 12 shipped module specs, including this one
│           └── pledge-paid.md        # Next payments slice. Not shipped
│
├── app/
│   ├── api/v1/config.py              # GET/PATCH /api/v1/config
│   ├── models/base.py                # { success, message, data }
│   ├── core/
│   │   ├── authorization.py          # require_roles and service re-checks
│   │   ├── config.py                 # .env settings, including ENABLED_MODULES
│   │   ├── db.py                     # engine, create_all, small ALTER list, bulletin slug backfill
│   │   ├── deps.py
│   │   ├── hebrew_date.py            # only Hebrew-date implementation
│   │   ├── hooks.py                  # event bus
│   │   ├── llm.py
│   │   ├── rate_limit.py
│   │   ├── registry.py
│   │   ├── security.py
│   │   ├── tenant.py                 # TenantConfig and ALL_MODULES
│   │   ├── tenant_service.py
│   │   └── zmanim.py
│   └── modules/
│       ├── aliyot/                   # api, models, module, service
│       ├── auth/
│       ├── azkarot/
│       ├── bulletin/
│       ├── congregants/
│       ├── payments/
│       ├── prayer_schedule/
│       ├── seating/
│       ├── smachot/
│       ├── calendar/                 # api, module, service. No models.py
│       └── llm/                      # api, module, service. No models.py
│
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── 462a2db307be_initial_schema.py
│       └── a7f4c2d9e861_add_gabai_role.py
│
├── tests/
│   ├── conftest.py
│   ├── test_aliyot.py
│   ├── test_auth.py
│   ├── test_authorization.py
│   ├── test_azkarot.py
│   ├── test_bulletin.py
│   ├── test_calendar.py
│   ├── test_config.py
│   ├── test_congregants.py
│   ├── test_csv_import.py            # Import page / congregants CSV
│   ├── test_llm_scope.py
│   ├── test_payments.py
│   ├── test_places.py                # seating
│   ├── test_prayer_schedule.py
│   ├── test_rate_limit.py
│   ├── test_scope.py
│   └── test_smachot.py
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── eslint.config.js
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── README.md                     # Frontend setup notes
    ├── graphify-out/                 # Local. Gitignored by **/graphify-out/
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.tsx
        ├── App.tsx                   # All routes
        ├── index.css
        ├── api/
        │   ├── client.ts             # Only backend caller
        │   └── client.test.ts
        ├── contexts/
        │   ├── AppConfigContext.tsx  # Tenant config. Not a data cache
        │   └── AuthContext.tsx       # Session. Not a data cache
        ├── components/
        │   ├── auth/ProtectedRoute.tsx   # ProtectedRoute and unused RoleGate
        │   ├── layout/
        │   │   ├── Header.tsx
        │   │   ├── Layout.tsx
        │   │   └── Sidebar.tsx       # Module nav from config, plus hardcoded Import
        │   └── ui/
        │       ├── Badge.tsx
        │       ├── Button.tsx
        │       ├── CalendarDatePicker.tsx
        │       ├── Card.tsx
        │       ├── DatePickerField.tsx
        │       ├── EmptyState.tsx
        │       ├── Input.tsx
        │       ├── Modal.tsx
        │       └── PageHeader.tsx
        └── pages/
            ├── Aliyot.tsx
            ├── Azkarot.tsx
            ├── Bulletin.tsx
            ├── Calendar.tsx
            ├── Chat.tsx
            ├── Congregants.tsx
            ├── Dashboard.tsx
            ├── Import.tsx
            ├── Login.tsx
            ├── Payments.tsx
            ├── PrayerSchedule.tsx
            ├── Seating.tsx
            └── Smachot.tsx
```

Every page file is routed from `App.tsx`. Every UI component file is part of the design system. There is no orphan page file.
