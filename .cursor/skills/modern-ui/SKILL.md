---
name: modern-ui
description: Apply modern, clean, and spiritual design standards for the Gabay Synagogue Management system. Use when designing new pages, updating existing UI, or when the user asks for a "modern design" or "UI refresh".
---

# Modern UI Design for Gabay

> Redesign in progress (milestone v2.2.5, "Warm Heritage": warm stone background, midnight blue primary, bronze accent, Hebrew serif titles). The palette below is the current one and is replaced in subtask F1; this skill is rewritten in F9. Follow `docs/agent/frontend.md` and `ROADMAP.md` for the current status, and do not add new hardcoded hex colors in the meantime.

## Design Principles
1. **Spiritual Elegance**: Use a palette of Deep Indigo (#2E3A59) and Muted Gold (#C5A059).
2. **Modern Clarity**: Prioritize white space, large typography, and rounded corners (`rounded-xl`).
3. **Hebrew First**: Ensure full RTL support, proper text alignment, and legible Hebrew fonts.
4. **Consistency**: Always use the shared UI components in `frontend/src/components/ui/`.

## Workflow
1. **Analyze**: Check the current layout and identify cluttered areas.
2. **Simplify**: Remove unnecessary borders and background colors. Use white backgrounds with subtle shadows.
3. **Componentize**: Replace raw HTML tags with `Button`, `Card`, `Input`, and `Badge` components.
4. **Refine**: Add hover states, loading indicators, and empty state illustrations.

## Reference
- See [examples.md](examples.md) for concrete code patterns.
