# Frontend redesign (Warm Heritage)

Status: approved
Roadmap item: v2.2.5
Owner: eran

Sources: `ROADMAP.md` (status row line 19, section "v2.2.5 - Frontend redesign (Warm Heritage)" lines 57-85), the plan `.cursor/plans/warm_heritage_frontend_final_8497efef.plan.md` (the "how"), `docs/agent/frontend.md`, `docs/product/WORKFLOW.md`, `docs/product/DECISIONS.md`. Code checked on `main` at `d3f0efc`.

Approval (2026-11-17): the owner approved this spec. Decisions D-1 to D-26 were accepted as recommended on 2026-11-16 (relayed by the coordinator) and are folded into the body below. No decision is pending. Where the plan and this spec disagree, the spec wins (`WORKFLOW.md`, "Spec and plan").

## Problem
The reason for this milestone is the roadmap's: it "runs before v2.3 so new financial screens are built on the new system" (`ROADMAP.md` line 59; `DECISIONS.md` 2026-11-16). No gabai complaint about the current look is recorded (D-16). The users are the gabai and the admin, who use every screen; the congregant role has no frontend routes today (`frontend/src/App.tsx` allows only `admin` and `gabai`).

Supporting facts (verified in code):
- Colors are six brand variables plus HSL variables in plain `:root` (`frontend/src/index.css`); there is no Tailwind `@theme` block and no semantic tokens.
- `npm run design:status` on `main` reports 557 violating lines in 23 files: 81 hex, 414 raw gray-family, 38 physical-direction, 24 arbitrary color values. The largest is `pages/Congregants.tsx` (122).
- The script misses old-palette uses: 13 files reference the old CSS variables directly (mostly in inline `style`), and `Sidebar.tsx`, `Layout.tsx` and `Login.tsx` report 0 while still using them. F0b closes this gap (D-19).
- The script also does not count raw Tailwind palette classes other than the gray family: a rough grep finds 259 lines in 18 files using `blue-`, `red-`, `green-` and similar (`Chat.tsx` alone has 19). F0b adds a rule that counts them (D-22).
- `components/ui/` has 9 primitives: `Badge`, `Button`, `CalendarDatePicker`, `Card`, `DatePickerField`, `EmptyState`, `Input`, `Modal`, `PageHeader`. There is no `DataTable`, `Tabs`, `Toast`, `Skeleton`, `StatCard`, `Num` or `Ltr`. A case-insensitive search for "toast" in all of `frontend/src` returns nothing, so the rule "every action shows success/error feedback" has no shared component behind it.
- The shell is a fixed 240px sidebar (`w-60`, `Sidebar.tsx`) with no drawer or breakpoint in `Layout.tsx`, so on a 375px phone the sidebar takes most of the width.
- The assistant exists only as the `/chat` page (`frontend/src/pages/Chat.tsx`); the conversation lives in that page's local state and is lost when the user navigates to another page.
- A tenant can override primary, secondary and background colors (`applyTheme` in `AppConfigContext.tsx`), so no contrast guarantee is possible.
- The only frontend test is `frontend/src/api/client.test.ts`.

## User story
As a gabai or admin, I want every screen to share one calm, readable design that works on a phone, a tablet and a desktop, with dense tables and clear feedback after every action, so that I can do daily work on any device without layout problems.

As a gabai or admin, I want to open the assistant beside the page I am working on, so that I can ask a question without leaving my task.

As the owner, I want the design rules enforced by a script, so that v2.3 screens are built once on the new system and old styles do not come back.

## Success check
- The gabai completes the existing flows (add a congregant, record a payment, assign an aliya, print the bulletin) on a 375px phone with no horizontal scroll and no hidden controls.
- The gabai asks the assistant a question from the Congregants page, moves to Payments, and the conversation is still there.
- `npm run design:check` exits 0, is in the definition of done and runs in CI, so v2.3 pages start clean.
- A tenant accent color that keeps text readable is applied; one that does not is replaced by the default bronze, so text contrast stays AA on every install.

## Target state (what the user gets)
Hex values are the plan's proposals; the look is confirmed at Gate 1.
- Warm stone page background (`bg` #FAF8F5), white surfaces (`surface` #FFFFFF) with 1px hairline borders (`line` #E7E5E4), radius 8-10px, no resting shadows (elevation only for modals, popovers, toasts).
- Midnight blue `primary` (#172554), bronze `accent` (#B45309) for fills and rules, `accent-ink` (`color-mix(in oklab, var(--color-accent) 70%, black)`) for text. Status colors `success`, `warning`, `danger`, `info`, each with a soft background and an AA text pair.
- Heebo for UI; Frank Ruhl Libre as the display face, used only for page titles, the Hebrew date, the parasha and the bulletin. Both load through the Google Fonts link in `frontend/index.html` (D-6).
- Thin bronze rule under page titles and section heads; light stone sidebar with a bronze edge on the active item; Dashboard "today" strip (Hebrew date, parasha, candle lighting, next prayer) with a small row of `StatCard`s below it (D-12).
- Dense tables with sticky headers and tabular numerals; semantic status badges; motion 120-180ms, honoring `prefers-reduced-motion`.
- The assistant is a side panel available on every screen, opened from the header; `/chat` shows the same component full-page (D-1).
- Tenants can change only the accent color and the logo. The accent is the stored `color_secondary`; an accent that fails the contrast test falls back to the default bronze (D-5, D-20).
- Existing `components/ui/` props stay valid; new `DataTable`, `Tabs`, `Toast`, `Skeleton`, `StatCard`, `Num`, `Ltr`.
- RTL through logical utilities only; AA contrast; visible focus ring; 44px touch targets under 768px; no horizontal scroll at 375, 768 and 1280px.

## Acceptance criteria

### Standard checks (every slice)
- [ ] S1. In `frontend/`: `npm run lint`, `npm run build` and `npm test` all pass.
- [ ] S2. `npm run design:status`: the total is not higher than the total recorded at the end of the previous slice, and every file the slice declares migrated reports 0 in all columns. New files report 0.
- [ ] S3. Browser check of every screen the slice touched, at 375x812, 768x1024 and 1280x800: a screenshot is saved under `frontend/.design-shots/<slice>/`; the console shows no errors; `document.documentElement.scrollWidth <= window.innerWidth` is true. The `developer` agent runs this check and attaches the screenshots; `tester` verifies the non-browser criteria and reviews the screenshots (D-9). Preconditions: the backend running on the test database set up in F0b, `npm run dev`, and the test admin login from that setup (D-23). The real `gabay.db` and real credentials are never used for these checks.
- [ ] S4. Keyboard: Tab reaches every interactive control on the touched screens in a sensible order; Escape closes any open modal, drawer or overlay.
- [ ] S5. No backend file, no schema and no `package.json` dependency changes. No new npm dependency is approved in this spec (D-6, D-7).
- [ ] S6. Two failed fix attempts on the same check: work stops and is reported to the owner (`AGENTS.md`).
- [ ] S7. The slice (for F5, F6 and F7: each page) is committed only after the owner's gabai pass is recorded as accepted; `CHANGELOG.md` has a line for slices the user can see. Work is on branch `feat/frontend-redesign`, one draft PR opened after F0b and merged after F9 (D-18).
- [ ] S8. Function components only (no `React.FC`), `import type` for types, no `dir` override, and none of the patterns the status script counts (D-21).

### F0b - Baseline and status tooling
- [ ] The existing `frontend/scripts/design-status.mjs` (on `main` since commit `74ec7d4`) is kept as the base (D-2): Node built-ins only, scans `src/**/*.{ts,tsx}`, counts per file hex colors, `(gray|slate|zinc|stone)-N`, physical-direction classes (`pl|pr|ml|mr`, `text-left`, `text-right`, `flex-row-reverse`, `space-x-reverse`) and `bg-[#` / `bg-[var(`.
- [ ] The script is extended with two counted rules (D-19): (a) `cssvar`: a line in a `.ts` or `.tsx` file that contains `var(--color-`, `--color-indigo` or `--color-gold`; (b) `inline`: a line with a `style` attribute that sets `color`, `background`, `backgroundColor` or `borderColor`. Both are in the per-file total and in `design:check`. `setProperty('--color-accent', ...)` in `AppConfigContext.tsx` is not a violation.
- [ ] After the extension, `Sidebar.tsx`, `Layout.tsx` and `Login.tsx` report more than 0 (they report 0 today).
- [ ] The script is extended with a `palette` rule (D-22): a line containing a Tailwind palette color class with a numeric shade, for any of `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `neutral` (for example `bg-blue-600`, `text-red-500`, `border-green-200`). `white`, `black` and `transparent` are allowed. It is in the per-file total and in `design:check`. After the extension `Chat.tsx` reports more palette lines than its 5 total today.
- [ ] `npm run design:status` exits 0 and prints per-file counts and a total. `npm run design:check` exits 1 while any violation exists.
- [ ] The baseline is the extended script's output, recorded per rule and in total in this spec's "Baseline record" (D-3). The figures in the plan and the roadmap (86 / about 490 / about 26) are not used.
- [ ] `frontend/.design-shots/` is in `.gitignore`, and baseline screenshots of all 13 screens (Login plus the 12 routes in `App.tsx`) at the three widths are saved in `frontend/.design-shots/baseline/` (D-10). They show test data only.
- [ ] Test setup (D-23): the backend runs on a throwaway SQLite file selected with `DATABASE_URL`, stored under `frontend/.design-shots/`; a test admin is registered through the existing bootstrap endpoint; a small fixed data set is added through the existing API (at least: 5 congregants including one archived, 3 payments, 1 aliya, 2 azkarot, 1 simcha, 2 seats with one assigned, 1 prayer rule). The steps to recreate it are written in a short text file in the same folder, so the same data is used through F8. The test credentials stay in that git-ignored folder and are not written in the spec, the PR or chat. If a fresh database file does not start cleanly, the developer stops and reports; no backend code is changed to make it work.
- [ ] S1 is green before any change under `frontend/src`.

### F1 - Tokens and fonts
- [ ] `frontend/src/index.css` has an `@theme` block with the semantic tokens: `bg`, `surface`, `line`, `ink`, `muted`, `primary`, `primary-hover`, `accent`, `accent-ink`, the four status colors each with a soft background and a text pair, radius, one popover shadow, a type scale and `--font-display`.
- [ ] `--color-indigo` and `--color-gold` remain as aliases in plain `:root` (not in `@theme`), so unmigrated pages still render.
- [ ] Base rules exist for a visible focus ring and for `prefers-reduced-motion`.
- [ ] Frank Ruhl Libre is added to the existing Google Fonts link in `frontend/index.html`; no `@fontsource` package (D-6). No component uses it yet.
- [ ] `applyTheme` reads only `color_secondary` as the tenant accent (D-5). It no longer writes `--color-indigo`, `--color-gold` or the background, and it ignores `color_primary` and `color_bg`. The document title write stays. Logo handling is unchanged (the logo is read from config in `Sidebar.tsx` and `Login.tsx`). No `TenantConfig` column or default changes.
- [ ] Contrast fallback (D-20, D-24): before writing `--color-accent`, the frontend computes the WCAG 2.x contrast ratio of white text (`#FFFFFF`, the text color on accent fills) against the tenant accent. At 4.5:1 or higher the tenant value is written. Below 4.5:1, or when the value is empty or not a valid color, nothing is written and the default bronze from `index.css` applies. There is no message to the admin (a warning is backlog B-012, v2.5). The default bronze is never written as a hex literal in a `.ts`/`.tsx` file.
- [ ] Consequence, checked in the browser: an install whose `color_secondary` is still the stored default `#C5A059` shows the bronze accent (`getComputedStyle` of `--color-accent` is the `index.css` default).
- [ ] `npm test` covers the contrast function: `#B45309` (about 5.0:1) and `#172554` pass; `#C5A059` (about 2.5:1) and `#FACC15` fail and fall back; an empty string and an invalid value fall back. Test files are not scanned differently by the status script, so the test colors are built without hex literals or the test file is the script's single documented exemption; the developer picks one and says which.
- [ ] A contrast table (every text/background token pair with its computed ratio) is recorded in "Contrast record", and every pair is at least 4.5:1 for normal text and 3:1 for large text and UI borders that carry meaning.
- [ ] `getComputedStyle` shows `accent-ink` resolves to a valid color for the default accent and for one other passing tenant accent; both ratios on `surface` are recorded.
- [ ] Unused HSL variables are removed only if a grep shows no reader; `--border` stays while `border-color: hsl(var(--border))` uses it.
- [ ] All 13 screens render at the three widths (S3). Because redefining `--radius-*` and `--shadow-*` changes built-in `rounded-*` and `shadow-*` everywhere, each screen is rechecked and any visible break is listed for the owner.

### F2 - Restyle existing primitives
- [ ] `Button`, `Card` family, `PageHeader`, `Input`, `Badge`, `Modal`, `EmptyState`, `DatePickerField` and `CalendarDatePicker` use only the F1 tokens; each of these 9 files reports 0 in `design:status`.
- [ ] No existing prop is removed or renamed: `npm run build` passes with no change to any call site in `src/pages/`. Changes are additive (`Button` gains an `accent` variant).
- [ ] `PageHeader` shows the title in the display font with the bronze rule; `EmptyState` has no icon-in-circle.
- [ ] Screenshots exist for every `Button` variant and size, the disabled and loading states, keyboard focus on each interactive primitive, and an open `Modal` and date picker.

### Gate 1 - design review (evidence from F2; blocks F3)
- [ ] G1.1 The owner is shown screenshots of every primitive and of one sample page at 375, 768 and 1280px.
- [ ] G1.2 The owner's answer (approved, or the requested changes to palette, typography, display face or density) is written in the "Gabai pass" section with the date.
- [ ] G1.3 F3 does not start until the answer is "approved". Requested changes are made inside F2 and the gate is shown again.

### F3 - New primitives and tests
- [ ] `DataTable`, `Tabs`, `Toast` (provider plus `useToast`), `Skeleton`, `StatCard`, `Num` and `Ltr` exist in `frontend/src/components/ui/`, and each file reports 0 in `design:status`.
- [ ] `npm test` runs tests for each new primitive using `react-dom/server` `renderToStaticMarkup`, asserting classes, `disabled`, `aria-*` and `dir`. No `jsdom`, no Testing Library (D-7).
- [ ] `Toast` renders with `role="status"`; `Num` renders tabular numerals inside an LTR isolate; `Ltr` renders its content `dir="ltr"`.
- [ ] In the browser: `DataTable` header stays visible while the body scrolls; `Tabs` can be operated by keyboard and the selected tab is exposed to assistive technology; a toast appears and disappears without moving focus.

### F4 - Shell and Login
- [ ] `Sidebar.tsx`, `Header.tsx`, `Layout.tsx` and `Login.tsx` report 0 in `design:status`.
- [ ] The sidebar is light stone with a bronze edge on the active item (no filled pill).
- [ ] Under 1024px the sidebar is a drawer: it opens from a header control, closes on Escape and on an outside click, and focus returns to the control that opened it.
- [ ] Logout uses `Button`.
- [ ] Authorization is unchanged: an `admin` and a `gabai` see the same navigation items as before the slice; a `congregant` login is still blocked from every route under `Layout` (same `ProtectedRoute allowedRoles={['admin','gabai']}` in `App.tsx`).
- [ ] The shell and Login look correct with a long synagogue name (40+ characters) and with an empty `logo_url`.
- [ ] A Dashboard mock for Gate 2 exists (D-4): one file, `frontend/src/pages/DashboardMock.tsx`, with static markup only (today strip and `StatCard` placeholders, no data fetching), reachable at a temporary route inside the protected layout and not linked from the navigation. It reports 0 in `design:status`.

### F4b - Assistant side panel
From `ROADMAP.md` line 77 and `DECISIONS.md` 2026-11-03. Frontend only.
- [ ] B1. A toggle control in the header opens and closes the assistant panel on every route under `Layout`. It is a `Button` with a Hebrew accessible name, and it exposes its open or closed state (`aria-expanded`).
- [ ] B2. The toggle is shown only when the `llm` module is enabled in the config manifest, the same condition `Sidebar.tsx` uses for the `/chat` entry. With `llm` disabled there is no toggle and no panel.
- [ ] B3. At 1024px and wider, the open panel sits beside the page and pushes the content: no part of the page is covered, and there is no horizontal scroll at 1024 and 1280px with the panel open.
- [ ] B4. Below 1024px the open panel is an overlay above the page: Escape and an outside click close it, and focus returns to the toggle.
- [ ] B5. Under 768px the open panel covers the full screen and has a visible close control of at least 44px; Escape also closes it and focus returns to the toggle. From 768 to 1023px it is the overlay of B4 (D-25a).
- [ ] B6. The conversation survives navigation: after two exchanges on one page, moving to two other pages and reopening the panel shows the same messages in the same order.
- [ ] B7. A reply that arrives after the user has moved to another page appears in the conversation; the request is not cancelled by navigation.
- [ ] B8. `/chat` renders the same assistant component full-page, with the same conversation as the panel. The Sidebar entry for `/chat` is unchanged.
- [ ] B9. Privacy: after logout, and after login as a different user in the same browser tab, the panel and `/chat` show no messages from the previous user. A page reload starts a new conversation, as today (saved conversations are v2.2.6).
- [ ] B10. Existing chat behavior is kept: the welcome message; the four suggestion chips while only the welcome message exists; Enter sends and Shift+Enter adds a line; the input is disabled and a typing indicator shows while waiting; tool actions appear as chips under the reply; an error (including 429 and 502) appears as a message in the thread; the disclaimer line under the input. The Hebrew strings are the ones in `Chat.tsx` today.
- [ ] B11. No backend, endpoint or LLM tool change. `frontend/src/api/client.ts` is not changed: the panel calls the existing `llmApi.chat(message, history)` and sends the history the same way `Chat.tsx` does today (all earlier turns except the welcome message).
- [ ] B12. The panel and `/chat` use only `components/ui/` primitives and F1 tokens; `Chat.tsx` and every new assistant file report 0 in `design:status`. No emoji as an icon (today's action chip uses one); icons come from lucide-react.
- [ ] B13. Per-page checklist for the `/chat` page: P1 (`PageHeader`), P5, P7 and P8 apply. P2 does not apply (the welcome message and suggestions are the empty state). P3 and P4 are met by the typing indicator and the in-thread error message; a toast is not added for each reply. The panel has a title bar, not a `PageHeader`.
- [ ] B14. The panel is checked (S3) at the three widths, open and closed, on at least the Dashboard and one table page.
- [ ] Reviewer note: until v2.2.6, the conversation is client state held above the routes (the backend is stateless). This does not break the rule "TanStack Query for all server state". v2.2.6 moves the messages to the server and leaves only UI state in the panel context.
- [ ] B15. On the `/chat` route the header toggle is not shown and the panel is not open; leaving `/chat` shows the toggle again (D-25b).
- [ ] B16. After a page reload the panel is closed on every route; the open state is not stored in `localStorage` (D-25c).
- [ ] B17. Under 1024px only one of the sidebar drawer and the assistant panel is open at a time: opening one closes the other (D-25d).
- [ ] B18. The panel and `/chat` have a "new chat" control with a Hebrew label. It clears the conversation back to the welcome message and the suggestion chips, and the next request sends an empty history. It is disabled while a reply is pending. No confirmation dialog is required (D-25e).
- [ ] B19. At 1024px and wider the panel has one fixed width (not resizable by the user); the value is shown at Gate 2 and changed there if the owner asks (D-25f).

### Gate 2 - design review (evidence from F4 and F4b; blocks F5, F6, F7)
- [ ] G2.1 The owner is shown screenshots at 375, 768 and 1280px of: the shell (sidebar, drawer open, drawer closed), the assistant panel (open in push, overlay and phone modes, and `/chat`), Login, and the Dashboard mock.
- [ ] G2.2 The owner's answer is written in the "Gabai pass" section with the date. The Dashboard layout (today strip above a `StatCard` row, D-12) is confirmed or changed here.
- [ ] G2.3 No page slice (F5, F6, F7) starts until the answer is "approved".

### Per-page checklist (every page in F5, F6, F7)
- [ ] P1. The page has `PageHeader`.
- [ ] P2. Every list that can be empty shows `EmptyState`.
- [ ] P3. Loading and error states are visible (throttle or fail the request to see them).
- [ ] P4. Every action shows a loading state and a success or error `Toast`.
- [ ] P5. No raw `button`, `table` or `input` where a shared component exists. Exception already documented in `docs/agent/frontend.md` ("Pitfalls"): a plain `<button>` on a colored overlay bar.
- [ ] P6. Money and times use `Num`; phones, emails and IDs use `Ltr`.
- [ ] P7. Verified at 375, 768 and 1280px (S3).
- [ ] P8. The page file, and any file split out of it, reports 0 in `design:status`.

Each page is accepted and committed on its own, with its own gabai pass line (D-8).

### F5 - Pages A: Dashboard and Congregants
- [ ] P1 to P8 for `Dashboard.tsx` and `Congregants.tsx`.
- [ ] The Dashboard shows a "today" strip with the Hebrew date, the parasha, candle lighting and the next prayer, and a row of `StatCard`s below it (layout as approved at Gate 2), using existing endpoints only. Verified: the Dashboard already shows `hebrew_date` and prayers from `scheduleApi.getSchedule`, and `client.ts` already has types carrying `parasha_he` and `candle_lighting` (`DayTimes`, `CalendarDay`). Not verified: which existing endpoint the strip calls for each field. If no existing endpoint supplies a field, the developer stops and asks; nothing is added to the backend in this milestone.
- [ ] `DashboardMock.tsx` and its temporary route are removed.
- [ ] Congregants uses `DataTable` and is split into table, detail panel and forms.
- [ ] These flows work as before: create, edit, archive, restore, bulk-delete (`POST .../bulk-delete`).
- [ ] The red bulk-delete confirmation bar is readable: its buttons have visible text (pitfall in `docs/agent/frontend.md`).

### F6 - Pages B: Payments, Aliyot, Azkarot, Smachot
- [ ] P1 to P8 for `Payments.tsx`, `Aliyot.tsx`, `Azkarot.tsx` and `Smachot.tsx`.
- [ ] Hebrew date display on these four pages is the same text as before the slice for the same records (compare with the baseline screenshots).
- [ ] Azkarot and Smachot ordering is unchanged for the same data.
- [ ] Every money column uses `Num`.
- [ ] No payments logic changes: the diff of `Payments.tsx` contains no change to request payloads, amounts, handlers or delete behavior. The reviewer states this explicitly in the report; with that statement the second-reviewer rule for money does not apply (D-15). If the reviewer cannot state it, the second reviewer runs.

### F7 - Pages C: Seating, Calendar, PrayerSchedule, Bulletin, Import
- [ ] P1 to P8 for `Seating.tsx`, `Calendar.tsx`, `PrayerSchedule.tsx`, `Bulletin.tsx` and `Import.tsx`. (Chat is in F4b.)
- [ ] Drag and drop still works in Seating and in the prayer rule editor (dnd-kit kept); seat numbering is unchanged.
- [ ] The three bulletin formats (WhatsApp text, email HTML, A4 print) still render; the print preview is A4.
- [ ] The Calendar month grid is correct in RTL (the week starts on the right, days in the right columns).

### F8 - Cleanup and enforcement
- [ ] `npm run design:check` exits 0 and reports total 0.
- [ ] `--color-indigo` and `--color-gold` do not appear anywhere under `frontend/src`, `index.css` included (grep returns nothing). There is no hex color outside `index.css`. (`--color-bg` stays: it is the `bg` token.)
- [ ] `.github/workflows/ci.yml` runs `npm run design:check` in the frontend job after lint, build and test (D-14).
- [ ] Accessibility pass on all 13 screens and the assistant panel, recorded as a short list in this spec: focus order, AA spot checks against the F1 contrast table, touch targets at least 44px under 768px, and no animation when `prefers-reduced-motion` is set.
- [ ] Final screenshots at the three widths are saved in `frontend/.design-shots/final/` and compared by eye with the baseline for content only: no missing data and no missing controls (D-17).
- [ ] S1 is green.

### F9 - Final docs
- [ ] `docs/agent/frontend.md`: the "Modern Gabay" section is replaced (tokens, fonts, radius and shadow, new components, the assistant panel, tenant accent rule and fallback, `design:check`) and the "Redesign in progress" note is removed.
- [ ] `.cursor/skills/modern-ui/SKILL.md` and `examples.md` describe the new palette; the example with `bg-[#2E3A59]` is gone. `.cursor/rules/modern-ui.mdc` stays a pointer.
- [ ] `AGENTS.md`: the Frontend colors hard rule names the new tokens, and `npm run design:check` is in the definition of done. `docs/product/WORKFLOW.md`: the frontend line in the Definition of Done and in the small lane gets the same addition, so the two files match (D-13).
- [ ] A grep of `AGENTS.md`, `docs/agent/`, `docs/hierarchy/`, `docs/ARCHITECTURE.md`, `.cursor/skills/` and `.cursor/rules/` for `#2E3A59`, `#C5A059`, `--color-indigo` and `--color-gold` returns nothing. (Today the stale references are `AGENTS.md` line 36, `docs/hierarchy/ARCHITECTURE.md` line 144, `.cursor/skills/modern-ui/SKILL.md` line 11 and `examples.md` line 24; `docs/ARCHITECTURE.md` has none.)
- [ ] `ROADMAP.md` v2.2.5 items are ticked and the row is `Done`, mirrored in `docs/ROADMAP_HE.md`; both list the same items. The coordinator makes this edit. Backlog B-006 is set to `done`.

## Out of scope
- Any backend, schema or `TenantConfig` column or default change; any new endpoint or LLM tool.
- Any change to authorization. The redesign must not change which role sees which route.
- Any change to payments logic (void, refund, bulk delete). That is v2.3.
- Saved assistant conversations, history list, rename and delete (v2.2.6, `specs/assistant-chat-history.md`).
- Page-aware assistant context (B-009); opening the assistant to congregants.
- A `/settings` page or UI to pick the accent color and logo, and any message telling an admin that their accent was replaced (v2.5, B-012).
- New npm dependencies: `@fontsource` (B-014), `jsdom` and Testing Library (B-013).
- Dark mode (B-015).
- Visual regression tooling, a component gallery or Storybook.
- Congregant-role screens (none exist today).

## Risks and open questions
- Large diff. Every page changes. Mitigation: one commit per slice or page, the two gates, and the baseline screenshots.
- F1 changes every page at once (radius and shadow tokens are global). Unmigrated pages will look mixed until F5 to F7 finish; `main` keeps the old look until the PR merges after F9.
- Long-lived branch: `feat/frontend-redesign` lives for the whole milestone. Any other frontend work in that time conflicts with it; the v2.2.6 frontend slice therefore starts only after this milestone is merged (D-26).
- Regression risk without DOM tests: page behavior is verified by manual browser checks only. Server-render tests cover the new primitives and the contrast function, not page flows.
- F4b holds the conversation in memory above the routes. It must be cleared on logout (criterion B9), because synagogue computers are shared.
- F4b browser checks need a working LLM provider key in the local `.env`. Without one the developer can check only the layout and the error path, and the owner sees real replies in the gabai pass.
- The test database setup (F0b) relies on a fresh SQLite file starting cleanly. `app/core/db.py` creates tables with `SQLModel.metadata.create_all`, but a fresh start was not run while drafting.
- Tenant accent: an accent below 4.5:1 is replaced by bronze without any message to the admin until v2.5 (B-012). Installs with the stored default gold show bronze after F1.
- Unverified in the plan itself (plan section 6): the font loading approach, React 19 portal and focus details, and all contrast values. These are verified inside F1 and F3.
- Schema: none. Auth/authz: none; F4 and F4b have explicit unchanged-access criteria. Dependencies: none.

## Slices
Each slice also carries the standard checks S1 to S8. Linked plan (the "how"): `.cursor/plans/warm_heritage_frontend_final_8497efef.plan.md`. The plan has no F4b and still lists Chat in F7; this spec wins.

Order: F0b, F1, F2, Gate 1, F3, F4, F4b, Gate 2, F5, F6, F7, F8, F9.

### F0b - Baseline and status tooling
- Goal: a measured, reproducible starting point before any visual change.
- Scope: extend the status script with the `cssvar`, `inline` and `palette` rules; set up the test database and test admin; run lint, build and test; record the baseline; take baseline screenshots of all 13 screens.
- Files in scope: `frontend/scripts/design-status.mjs`, `frontend/package.json` (scripts only, if needed), `.gitignore` (add `frontend/.design-shots/`), this spec ("Baseline record").
- Out of scope: any change under `frontend/src`.
- Depends on: nothing. F0a (docs and roadmap) is already ticked in `ROADMAP.md` line 70 and is not a slice of this spec.
- Gate: F0b criteria (baseline recorded from the extended script; all checks green).

### F1 - Tokens and fonts
- Goal: the token contract exists and old pages keep rendering.
- Scope: `@theme` tokens, temporary aliases, focus and reduced-motion base rules, display font link, `applyTheme` limited to the accent with the contrast fallback, contrast table.
- Files in scope: `frontend/src/index.css`, `frontend/index.html`, `frontend/src/contexts/AppConfigContext.tsx`, one new helper and its test under `frontend/src/lib/` for the contrast function, this spec ("Contrast record").
- Out of scope: restyling any component or page; `TenantConfig`; removing the aliases.
- Depends on: F0b.
- Gate: F1 criteria (contrast recorded and AA; fallback tested; all screens render).

### F2 - Restyle existing primitives
- Goal: the 9 existing primitives look like Warm Heritage with no API change.
- Scope: `Button` (plus `accent` variant), `Card` family, `PageHeader`, `Input`, `Badge`, `Modal`, `EmptyState`, `DatePickerField`, `CalendarDatePicker`.
- Files in scope: those 9 files in `frontend/src/components/ui/`.
- Out of scope: pages, shell, new components, prop removals or renames.
- Depends on: F1.
- Gate: F2 criteria, then Gate 1 (owner design review), which blocks F3.

### F3 - New primitives and tests
- Goal: the shared building blocks the pages need.
- Scope: `DataTable`, `Tabs`, `Toast` with provider and `useToast`, `Skeleton`, `StatCard`, `Num`, `Ltr`, with server-render tests.
- Files in scope: new files in `frontend/src/components/ui/` and their test files; the app root for the toast provider (`App.tsx` or `main.tsx`).
- Out of scope: using them in pages; `jsdom`; Testing Library.
- Depends on: F2 and Gate 1 approved.
- Gate: F3 criteria.

### F4 - Shell and Login
- Goal: the frame around every page, usable on a phone.
- Scope: light sidebar with bronze active edge, header, drawer under 1024px, Login, logout via `Button`, the static Dashboard mock for Gate 2.
- Files in scope: `frontend/src/components/layout/Sidebar.tsx`, `Header.tsx`, `Layout.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/DashboardMock.tsx` (new, temporary), `frontend/src/App.tsx` (temporary route only).
- Out of scope: `AuthContext`, `ProtectedRoute` logic, navigation items, the assistant panel (F4b).
- Depends on: F3.
- Gate: F4 criteria. Gate 2 follows F4b.

### F4b - Assistant side panel
- Goal: the assistant is available beside every page, and the conversation is not lost when the user moves between pages.
- Scope: extract the chat UI from `Chat.tsx` into one assistant component used by both the panel and `/chat`; header toggle (hidden on `/chat`); push layout at 1024px and wider with a fixed width, overlay from 768 to 1023px, full-screen under 768px; drawer and panel mutually exclusive under 1024px; "new chat" control; conversation state held above the routes and cleared on logout; restyle to the new tokens.
- Files in scope: `frontend/src/pages/Chat.tsx`, new assistant component and state files under `frontend/src/components/` (for example `components/assistant/`), `frontend/src/components/layout/Header.tsx` (toggle), `frontend/src/components/layout/Layout.tsx` (panel slot and push layout), and the logout path only as far as needed to clear the conversation.
- Out of scope: `frontend/src/api/client.ts`; any backend file; saved conversations, history list, rename, delete (v2.2.6); page-aware context (B-009); streaming replies; changing which roles can use the assistant; the Sidebar `/chat` entry.
- Depends on: F4 (header and layout), F3 (`Button`, `Skeleton`, `Toast` provider).
- Gate: F4b criteria B1 to B19, then Gate 2 (owner design review of shell, panel, Login and Dashboard mock), which blocks F5, F6 and F7.

### F5 - Pages A: Dashboard and Congregants
- Goal: the two most used screens on the new system.
- Scope: Dashboard "today" strip and `StatCard` row; removal of the mock; Congregants on `DataTable`, split into table, detail panel and forms. Accepted and committed per page: Dashboard, then Congregants.
- Files in scope: `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/Congregants.tsx` and files split out of them; `DashboardMock.tsx` and its route (delete).
- Out of scope: new endpoints, new Dashboard data, backend.
- Depends on: Gate 2 approved.
- Gate: P1 to P8 and F5 criteria.

### F6 - Pages B: Payments, Aliyot, Azkarot, Smachot
- Goal: the Hebrew-date and money screens on the new system with identical data.
- Scope: restyle and migrate the four pages, accepted and committed per page. The developer reads `docs/agent/domain-gotchas.md` first.
- Files in scope: `frontend/src/pages/Payments.tsx`, `Aliyot.tsx`, `Azkarot.tsx`, `Smachot.tsx` and files split out of them.
- Out of scope: payments logic, Hebrew date logic, ordering rules.
- Depends on: Gate 2 approved; runs after F5.
- Gate: P1 to P8 and F6 criteria.

### F7 - Pages C: Seating, Calendar, PrayerSchedule, Bulletin, Import
- Goal: the remaining screens on the new system with drag and drop and print intact.
- Scope: restyle and migrate the five pages, accepted and committed per page. The developer reads `docs/agent/prayer-schedule.md` first.
- Files in scope: `frontend/src/pages/Seating.tsx`, `Calendar.tsx`, `PrayerSchedule.tsx`, `Bulletin.tsx`, `Import.tsx` and files split out of them.
- Out of scope: replacing dnd-kit, seat numbering rules, bulletin content or formats, `Chat.tsx` (F4b).
- Depends on: Gate 2 approved; runs after F6.
- Gate: P1 to P8 and F7 criteria.

### F8 - Cleanup and enforcement
- Goal: zero violations, enforced in CI.
- Scope: remove the aliases and leftover references (including `ProtectedRoute.tsx`, which is named in no other slice); add `design:check` to CI; full accessibility and responsive pass; final screenshots.
- Files in scope: `frontend/src/index.css`, any file under `frontend/src` still reporting violations, `.github/workflows/ci.yml`.
- Out of scope: new features, redesigning approved screens.
- Depends on: F5, F6 and F7.
- Gate: F8 criteria (`design:check` exit 0, total 0, in CI).

### F9 - Final docs
- Goal: the docs describe the code that now exists.
- Scope: frontend guide, `modern-ui` skill and examples, `AGENTS.md` and `WORKFLOW.md` rules, roadmap status (by the coordinator), stale palette references.
- Files in scope: `docs/agent/frontend.md`, `.cursor/skills/modern-ui/SKILL.md`, `.cursor/skills/modern-ui/examples.md`, `AGENTS.md`, `docs/product/WORKFLOW.md`, `docs/hierarchy/ARCHITECTURE.md` (line 144), `ROADMAP.md`, `docs/ROADMAP_HE.md`, `docs/product/BACKLOG.md`, `CHANGELOG.md`.
- Out of scope: code changes.
- Depends on: F8.
- Gate: F9 criteria (no stale palette references; English and Hebrew roadmaps match).

## Pending decisions
None. D-1 to D-26 are decided (table below). The spec waits only for the owner's approval.

## Decided (2026-11-16)
All of D-1 to D-26: owner accepted the PM recommendation, relayed by the coordinator, 2026-11-16.

| ID | Question | Decided | Where it is folded in |
|---|---|---|---|
| D-1 | Assistant side panel (roadmap F4b) | A: F4b is a slice between F4 and Gate 2; Gate 2 includes the panel; Chat leaves F7 | Slice and criteria F4b, Gate 2, F7 |
| D-2 | F0b partly shipped | A: the existing script is accepted as the base | F0b |
| D-3 | Baseline numbers | A: the baseline is the script's output at F0b; documented figures dropped | F0b, Baseline record |
| D-4 | "Dashboard skeleton" at Gate 2 | A: F4 builds a small static mock, removed in F5 | F4, Gate 2, F5 |
| D-5 | Tenant accent source | B: stored `color_secondary` is the accent; title and logo handling unchanged; no backend change. With D-24, installs that still have the stored default gold show bronze, because gold fails the contrast test | F1 |
| D-6 | Display font and loading | A: Frank Ruhl Libre through the Google Fonts link; no `@fontsource`; face confirmed at Gate 1 | Target state, F1, Gate 1 |
| D-7 | Component tests | A: `react-dom/server` only | F3, S5 |
| D-8 | Size of F5, F6, F7 | B: IDs kept; accepted and committed per page | S7, F5 to F7, Gabai pass |
| D-9 | Who runs browser checks | A: `developer` runs them and attaches screenshots; `tester` reviews | S3 |
| D-10 | Screenshot location | B: git-ignored `frontend/.design-shots/`, test data only | F0b, S3, F8 |
| D-11 | Page count | A: 12 routes plus Login; with D-1, F5 to F7 hold 11 pages and Chat is in F4b | F0b, F7 |
| D-12 | Dashboard stat cards | A: today strip above a small `StatCard` row, confirmed at Gate 2 | Target state, Gate 2, F5 |
| D-13 | `WORKFLOW.md` definition of done | Yes: updated with `AGENTS.md` in F9 | F9 |
| D-14 | `design:check` in CI | A: added in F8 | F8 |
| D-15 | Second reviewer for F6 | Not needed if the reviewer states that `Payments.tsx` has no payload or handler change | F6 |
| D-16 | Problem statement | A: the roadmap's reason | Problem |
| D-17 | Baseline comparison | A: content only, by eye | F8 |
| D-18 | Branch and PR | A: `feat/frontend-redesign`, one draft PR after F0b, merged after F9 | S7 |
| D-19 | Script blind spot | A: the script is extended in F0b | F0b, S2 |
| D-20 | Accents that fail AA | B: frontend computes contrast and falls back to bronze, in F1 | F1 |
| D-21 | Plan-only details | A: all adopted (keyboard checks; no `React.FC`, `bg-[var()]` or raw gray classes; `Toast` per action; motion and radius values; display font on Hebrew date, parasha and bulletin; F9 extra doc work; per-slice gabai pass and commit; `TenantConfig` cleanup is ask-first) | S4, S7, S8, P4, Target state, F9 |

| D-22 | Raw palette classes not counted by the script | A: new `palette` rule for every Tailwind palette color with a numeric shade; `white`, `black`, `transparent` allowed | F0b, S2, P8, F8 |
| D-23 | Test login and data for browser checks | A: throwaway SQLite file via `DATABASE_URL`, test admin through the bootstrap endpoint, fixed data set through the API, all under git-ignored `frontend/.design-shots/` | F0b, S3 |
| D-24 | Contrast fallback test | A: white text on the accent fill must reach 4.5:1; default-gold installs show bronze; silent replacement until v2.5 (B-012) | F1 |
| D-25 | Panel behaviors not in the roadmap | (a) full-screen under 768px; (b) toggle hidden on `/chat`; (c) always closed after reload; (d) drawer and panel never both open under 1024px; (e) "new chat" control in F4b; (f) fixed width, confirmed at Gate 2 | F4b B5, B15 to B19 |
| D-26 | Sequencing with v2.2.6 | A: the v2.2.6 frontend slice starts after v2.2.5 is merged to `main`; its backend slice may run in parallel with F1 to F4 | Risks; `specs/assistant-chat-history.md` |

Rough contrast numbers used in D-20 and D-24 (sRGB approximation made while drafting, not the real `oklab` mix; F1 records the real values): `#B45309` white-on-fill about 5.0:1, `accent-ink` on white about 8.4:1; `#C5A059` about 2.5:1 and 4.7:1; `#FACC15` about 1.5:1 and 3.1:1.

## Plan vs roadmap differences
Plan = `.cursor/plans/warm_heritage_frontend_final_8497efef.plan.md`. Roadmap = `ROADMAP.md`. Each difference is followed by how it ended. The plan file is not edited; where it differs from this spec, the spec wins.

1. F4b exists only in the roadmap (line 77); the plan has no F4b. Settled by D-1: the spec follows the roadmap; F4b is a slice.
2. Gate 2 scope: roadmap line 78 includes the assistant panel; plan line 146 does not. Settled by D-1: the panel is in Gate 2.
3. Chat: roadmap line 81 says "Chat moved to F4b"; plan line 158 keeps Chat in F7. Settled by D-1: Chat is in F4b; F7 has five pages.
4. F0a: roadmap line 70 ticks it; the plan (lines 5-7, 107) still says pending and speaks of "F0-F9". Settled: F0a is done and is not a slice; F0b is first.
5. F0b status: both show it pending, but the script is already on `main`. Settled by D-2 and D-19: the script is the accepted base and F0b extends it. F0b stays unchecked in the roadmap until its gabai pass.
6. Baseline numbers: both give 86 / about 490 / about 26; the script reports 81 / 414 / 38 / 24. Settled by D-3: the baseline is the extended script's output. The coordinator should correct `ROADMAP.md` line 71 after F0b. D-22 adds the `palette` rule, which neither document has; the spec wins.
7. Approval trigger: plan lines 3 and 106 treat plan approval as the start; roadmap line 59 and `WORKFLOW.md` say only the spec approves. Settled by project rule: work starts when the owner approves this spec.
8. Commits: plan lines 84 and 192 say commit when asked, in review chunks; `WORKFLOW.md` requires a gabai pass and commit per slice. Settled by D-21(g) and D-8: per slice, and per page in F5 to F7.
9. Self-check: the plan's section 2 adds keyboard checks, a roles-and-labels snapshot and preconditions to roadmap line 85. Settled by D-21(a) and D-9: S3 and S4. Updating the plan's own Status lines is not required.
10. F9 scope: plan lines 170-174 add roadmap ticks, an `ARCHITECTURE.md` check and a stale-reference grep to roadmap line 83; neither names `docs/hierarchy/ARCHITECTURE.md` line 144. Settled by D-21(f), D-13 and D-14: all in F9, plus `WORKFLOW.md`; CI is in F8.
11. Display font: plan line 55 names Frank Ruhl Libre and allows it on the Hebrew date, parasha and bulletin; roadmap line 62 says an unnamed serif "for titles only". Settled by D-6 and D-21(e): the plan's wording; the face is confirmed at Gate 1.
12. `applyTheme`: roadmap line 64 (ignores `color_primary` and `color_bg`) and plan line 62 (writes only `--color-accent` and the logo) do not name the accent field. Settled by D-5 and D-20: `color_secondary`, with a contrast fallback; logo handling unchanged. D-24 sets the test (white on accent, 4.5:1); the roadmap does not mention a fallback, and the spec wins.
13. Token detail: the plan (lines 60-63) defines more tokens than the roadmap (lines 62-63). No conflict; the spec uses the plan's list, confirmed at Gate 1.
14. Component rules only in the plan (lines 54, 57, 68, 73). Settled by D-21(b), (c), (d): adopted.
15. Gate 1: plan line 132 adds "a sample page" to roadmap line 74. No conflict; the spec uses the plan's wording (G1.1).
16. Link to v2.2.6: roadmap lines 20 and 89 tie v2.2.6 to Gate 2 and to F1-F4; the plan never mentions it. The dependency holds now that F4b is in this spec (D-1). Settled by D-26: the v2.2.6 frontend slice starts after v2.2.5 is merged, not after Gate 2; the roadmap wording needs the coordinator's edit (lines 20 and 89).
17. Ask-first items: plan line 193 adds "any `TenantConfig` cleanup". Settled by D-21(h): ask-first; none is in this spec.

Conflicts inside the plan itself: 11 vs 12 pages, settled by D-11; stat-card grid, settled by D-12.

## Baseline record
Filled in F0b from the extended `npm run design:status`.
- pending

## Contrast record
Filled in F1: token pair, computed ratio, pass or fail; tenant accent test results.
- pending

## Gabai pass
One line per slice, page and gate, written by the owner after trying it on realistic data: date, who tried it, result (accepted | fix | drop), notes.
- F0b: pending
- F1: pending
- F2: pending
- Gate 1: pending
- F3: pending
- F4: pending
- F4b: pending
- Gate 2: pending
- F5 Dashboard: pending
- F5 Congregants: pending
- F6 Payments: pending
- F6 Aliyot: pending
- F6 Azkarot: pending
- F6 Smachot: pending
- F7 Seating: pending
- F7 Calendar: pending
- F7 PrayerSchedule: pending
- F7 Bulletin: pending
- F7 Import: pending
- F8: pending
- F9: pending
