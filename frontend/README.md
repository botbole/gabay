# Gabay Frontend

React SPA for the Gabay Synagogue Management System.

## Stack

- React 19 + TypeScript
- Vite (dev server + build)
- Tailwind CSS (utility-first styling)
- TanStack Query (all server state — no Redux/Zustand)
- React Router 7
- Lucide React (icons)

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # production build → dist/
npm run lint       # ESLint
npm run preview    # serve production build locally
```

The dev server proxies all `/api` requests to `http://localhost:8080` (backend). No CORS configuration needed locally.

## Structure

```
frontend/src/
├── main.tsx                      # App entry point
├── App.tsx                       # Router + providers
│
├── api/
│   └── client.ts                 # Centralized API client — ALL fetch calls go here
│
├── contexts/
│   ├── AppConfigContext.tsx       # TenantConfig (branding, active modules) from /api/v1/config
│   └── AuthContext.tsx            # Current user, login, logout
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx             # App shell (sidebar + header + content)
│   │   ├── Sidebar.tsx            # Dynamic nav — renders only enabled modules
│   │   └── Header.tsx             # Page title + Hebrew/Gregorian date
│   ├── auth/
│   │   └── ProtectedRoute.tsx     # Role-gated route wrapper
│   └── ui/                        # Shared design system components
│       ├── PageHeader.tsx          # Required at top of every page
│       ├── EmptyState.tsx          # Required when list/table has no data
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       └── ...
│
└── pages/                         # One page per module
    ├── Dashboard.tsx
    ├── Congregants.tsx
    ├── Payments.tsx
    ├── Aliyot.tsx
    ├── Seating.tsx
    ├── Azkarot.tsx
    ├── Smachot.tsx
    ├── Calendar.tsx
    ├── PrayerSchedule.tsx
    ├── Bulletin.tsx
    ├── Chat.tsx
    ├── Import.tsx
    └── Login.tsx
```

## Key Conventions

**API calls:** All calls go through `src/api/client.ts` only. Never use `fetch` directly in a component or page.

**Server state:** TanStack Query for everything from the server. No global client-side stores.

**Components:** Always use `PageHeader` at the top of every page and `EmptyState` when a list is empty. Never use raw `div`/`button`/`input` when a `components/ui/` equivalent exists.

**RTL:** `dir="rtl"` is set globally on `<html>`. Never override it.

**Colors:** Use CSS variables only — `var(--color-indigo)`, `var(--color-gold)`, `var(--color-bg)`. Never hardcode hex values.

**Type imports:** Always use `import type { Foo }` for TypeScript interfaces to avoid Vite runtime errors.

## Role-Based UI

The sidebar and routes are role-aware:
- `super_admin` — sees `/platform` (support panel)
- `admin` — sees `/settings` (synagogue configuration)
- `gabai` — sees all operational pages; no settings link
- `congregant` — WhatsApp only; no web UI

Role is read from `AuthContext`. Backend is always the authorization source of truth — UI visibility is a usability control, not a security boundary.

## Design System

Font: Heebo (Google Fonts, loaded in `index.html`)

| Token | CSS Variable | Default |
|---|---|---|
| Primary | `--color-indigo` | `#2E3A59` |
| Secondary | `--color-gold` | `#C5A059` |
| Background | `--color-bg` | `#F8FAFC` |

Card radius: `rounded-xl` · Button radius: `rounded-lg`
