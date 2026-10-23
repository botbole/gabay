# Frontend guide

Stack: React 19, TypeScript, Vite, Tailwind v4, TanStack Query, lucide-react, dnd-kit. Vite proxies `/api` to `http://localhost:8080`.

## Architecture

- `api/client.ts` is the only place that talks to the backend. It exports domain objects (`congregantsApi`, `paymentsApi`, `seatingApi`, `aliyotApi`, `azkarotApi`, `smachotApi`, `llmApi`, `calendarApi`, ...) and handles the auth header, a single refresh retry and uniform 401 handling, including FormData/CSV uploads.
- Server state: TanStack Query. UI-only state: local React state. Contexts exist only for auth and app config, not data fetching.
- Auth: access token in memory; refresh token is an HttpOnly cookie. Clear the Query cache on logout.
- Config manifest from `GET /api/v1/config` drives the sidebar and CSS variables (`AppConfigContext`).

## Design system ("Modern Gabay")

> Redesign in progress (milestone v2.2.5, see `ROADMAP.md`). The rules below describe the code as it is today. Target: "Warm Heritage" with semantic `@theme` tokens (`bg`, `surface`, `line`, `ink`, `muted`, `primary`, `accent`, `accent-ink`, status colors), Heebo plus a Hebrew serif display face for titles, hairline-bordered surfaces, and tenant control over the accent color and logo only. Until subtask F1 lands, keep using the tokens below. After F1, new UI code must use the new semantic tokens and never add hex colors or raw `gray|slate|zinc` classes. Existing `components/ui/` props stay valid. This section is rewritten in F9. Plan: `.cursor/plans/warm_heritage_frontend_final_8497efef.plan.md`.

Modern, clean, spiritual.

- Colors via CSS variables in `src/index.css`: `var(--color-indigo)` (#2E3A59), `var(--color-gold)` (#C5A059), `var(--color-bg)` (#F8FAFC). Do not hardcode hex.
- Cards `rounded-xl` with `border-slate-200` and `shadow-sm`; buttons `rounded-lg`.
- Font: Heebo, set globally. Do not set fonts per component.
- RTL: `<html dir="rtl" lang="he">` is global. Prefer logical utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `text-start`) over `pl/pr/ml/mr`.
- Components from `components/ui/`: `PageHeader` (`title`, `subtitle`, `action`) on every page; `EmptyState` (`icon`, `title`, `description`, `action`) for empty lists; `Button`, `Input`, `DatePickerField`, `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Modal`, `Badge`. Avoid raw `div`/`button`/`input` when a shared component exists.
- Tables: borderless, subtle row separators, hover state.
- Mobile-first; forms and dashboards must work on tablets and phones.
- Feedback: loading states plus success/error notifications for every action.

## Pitfalls

- `import type { X }` for every interface or type. A plain import of a type compiles but throws a runtime `SyntaxError` in Vite/esbuild (hit `TenantConfig` and `LucideIcon`).
- After adding exports to `client.ts` or another widely imported module, if the browser shows the old version, restart `npm run dev` (stale optimizer bundle).
- `Button` `variant` styles can win over extra Tailwind color classes, and `variant="ghost"` text can be invisible on colored backgrounds (for example a red confirmation bar). In those overlay contexts use a plain `<button>` with explicit classes such as `bg-white text-red-600`.
- Visual bugs: confirm which element the user means before changing code.

## Checks

`npm run lint`, `npm run build` (runs `tsc -b`), `npm test` (vitest; currently only `client.test.ts`).
