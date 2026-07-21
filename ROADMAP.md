# ROADMAP – גבאי

מסמך זה מפרק את הפיתוח לאבני דרך. הצ'קבוקסים משקפים את המצב בפועל בקוד.

---

## סדר עדיפויות – סיכום

> **עיקרון:** פונקציונליות יומיומית לגבאי קודמת לפריסה ועיצוב. Auth נדרש לפני שיתוף חיצוני ולפני v3.5.

| גרסה | נושא | עדיפות | סטטוס |
|---|---|---|---|
| 1 | MVP – ניהול קהילה בסיסי | ✅ הושלם | Done |
| 2 | Core – לוח שנה + LLM | ✅ הושלם | Done |
| Infra | בדיקות אינטגרציה | ✅ הושלם | Done |
| **1.5** | **תשתית מודולרית** | ✅ **הושלם** | Done |
| **2.1** | **לוח זמני תפילות** | 🔴 הבא | Pending |
| **2.2** | **תקשורת ולוח שבועי** | 🔴 גבוהה | Pending |
| **2.3** | **פיננסים מלא** *(ממזג 2.5+2.7)* | 🟠 גבוהה | Pending |
| **2.4** | **גבאי חכם** *(שיבוץ + מלאי + LLM 2.0)* | 🟠 בינונית-גבוהה | Pending |
| **3.0** | **Production – Auth + Deploy** | 🔴 לפני שיתוף | Pending |
| **3.5** | **בוט וואטסאפ** *(תלוי ב-3.0)* | 🟡 קהילתי | Pending |
| **3.6** | **לוח שבועי מעוצב (Canva)** | 🟡 ליטוש | Pending |
| **4.0** | **SaaS Platform** | 🟢 מסחרי | Pending |
| **5.0** | **QA + אפליקציית מובייל** | 🔵 עתידי | Future |

---

## Milestone 1 – MVP · ייבוא נתונים וניהול מתפללים בסיסי ✅

יעד: מערכת שניתן להשתמש בה לניהול יומיומי של רשימת הקהילה.

### Backend
- [x] הגדרת מודל נתונים – `Congregant`, `Payment`, `Aliya`, `Place`, `Azkara`, `Simcha`
- [x] חיבור מסד נתונים (SQLite ברירת מחדל, תמיכה ב-PostgreSQL)
- [x] endpoint יצירת מתפלל (`POST /synagogue/congregants`)
- [x] endpoint קריאת מתפלל / רשימה עם סינון (`GET /synagogue/congregants`)
- [x] endpoint עדכון מתפלל (`PATCH /synagogue/congregants/{id}`)
- [x] ארכוב ושחזור מתפלל (`bulk-archive`, `bulk-restore`)
- [x] מחיקה מרובה (`bulk-delete`)
- [x] ייבוא מ-CSV (כולל תמיכה בכותרות עבריות)
- [x] ייבוא מ-Google Sheets

### Frontend
- [x] דף מתפללים – טבלת רשימה עם חיפוש וסינון לפי סוג חברות
- [x] מודל הוספת מתפלל חדש (כל השדות)
- [x] מודל עריכת מתפלל
- [x] מחיקה מרובה + ארכוב / שחזור עם בחירת תיבות סימון
- [x] מיתוג Active / Archived
- [x] דף ייבוא – העלאת CSV ו-Google Sheets URL
- [x] דף תשלומים – רישום, היסטוריה, רשימת ממתינים לתשלום
- [x] דף עליות – שיוך עלייה, תצוגה לפי פרשה, היסטוריה
- [x] דף מקומות ישיבה – רשימה, שיוך, ביטול שיוך
- [x] דף אזכרות – CRUD, רשימה קרובה
- [x] דף שמחות – CRUD, רשימה קרובה

---

## Milestone 2 – Core Features · לוח שנה מחובר ו-LLM פעיל ✅

יעד: כל הפיצ'רים המרכזיים פועלים ומחוברים זה לזה; הגבאי יכול לעבוד אך ורק דרך הצ'אט אם ירצה.

### לוח שנה עברי
- [x] תצוגת חודש מלאה עם תאריכים עבריים + גרגוריאניים
- [x] הדגשת שבתות וחגים
- [x] נקודות צבעוניות על ימים עם אזכרות (ענבר) ושמחות (ורוד)
- [x] פאנל פרטי יום – הצגת אזכרות ושמחות בעת לחיצה על יום
- [x] ניווט חודשים (הקודם / הבא / היום)
- [x] API המרת תאריכים דו-כיוונית (גרגוריאני ↔ עברי)

### לוח מחוון (Dashboard)
- [x] כרטיסיות סטטיסטיקה: סך מתפללים, סך תרומות, ממתינים לתשלום, אירועים קרובים
- [x] רשימת 5 האזכרות הקרובות (30 יום) עם שם הנפטר, קשר ותאריך
- [x] רשימת 5 השמחות הקרובות (30 יום) עם סוג האירוע ותאריך

### ממשק LLM (הגבאי הדיגיטלי)
- [x] ממשק צ'אט בעברית RTL עם בועות שיחה, אוואטר ואינדיקטור הקלדה
- [x] חיבור ל-endpoint `/api/v1/llm/chat`
- [x] תמיכה בהיסטוריית שיחה רב-תורנית
- [x] לולאת tool-calling אוטונומית (עד 10 סיבובים)
- [x] הצגת קריאות כלים (תג 🔧) בממשק
- [x] כלי מתפללים: `add_congregant`, `get_congregant`, `update_congregant`, `list_congregants`
- [x] כלי תשלומים: `record_payment`, `get_payment_history`, `get_pending_payments`, `get_all_payments`
- [x] כלי עליות: `assign_aliya`, `get_aliyot_for_parasha`, `get_aliya_history`
- [x] כלי אזכרות: `add_azkara`, `get_upcoming_azkarot`
- [x] כלי שמחות: `add_simcha`, `get_upcoming_smachot`
- [x] כלי מקומות: `list_places`, `get_congregant_place`
- [x] כלי לוח שנה: `convert_gregorian_to_hebrew`, `convert_hebrew_to_gregorian`

### פאנל פרטי מתפלל – השלמה
- [x] תצוגת פרופיל: שם, שם עברי, שמות הורים, טלפון, מייל, כתובת, סטטוס
- [x] הצגת מקום ישיבה משויך בפאנל
- [x] לשונית "תשלומים" – היסטוריית תשלומים ישירה בפאנל הפרטים
- [x] לשונית "עליות" – היסטוריית עליות ישירה בפאנל הפרטים
- [x] לשונית "אזכרות ושמחות" – הצגת רשומות קשורות למתפלל בפאנל הפרטים

---

## Infrastructure – Testing ✅

כלי בדיקות משולבים בפרויקט; ניתן להריץ בכל עת עם `pytest`.

- [x] הגדרת סביבת בדיקות: pytest + pytest-asyncio + httpx AsyncClient
- [x] מסד נתונים in-memory לטסטים (מבודד מ-gabay.db)
- [x] בדיקות אינטגרציה – מתפללים (יצירה, עריכה, ארכוב, מחיקה, סינון)
- [x] בדיקות אינטגרציה – תשלומים (רישום, היסטוריה, ממתינים)
- [x] בדיקות אינטגרציה – עליות לתורה (שיוך, היסטוריה, תרומה אוטומטית)
- [x] בדיקות אינטגרציה – מקומות ישיבה (יצירה, שיוך, ביטול, סינון)
- [x] בדיקות אינטגרציה – אזכרות (תאריך גרגוריאני ועברי, מחיקה)
- [x] בדיקות אינטגרציה – שמחות (סוגים שונים, סינון, מחיקה)
- [x] בדיקות לוח שנה עברי (המרות תאריכים, next-occurrence, month-view)
- [x] בדיקות ייבוא CSV (כותרות עבריות/אנגליות, כהן/לוי/ישראל, auto-create, שגיאות)

---

## ✅ Milestone 1.5 – Modular Foundation · תשתית מודולרית [DONE]

> **עדיפות:** הכרחי לפני כל פיצ'ר חדש. ללא שלב זה, כל פיצ'ר עתידי מתווסף לתוך monolith גדל.  
> **השפעה:** פותחת את הדרך לתמחור מודולרי, Multi-tenancy, ופיתוח מהיר של פיצ'רים חדשים.

### Core Infrastructure – Backend
- [x] `app/core/registry.py` – Module Registry: טעינה דינמית של מודולים לפי `ENABLED_MODULES`
- [x] `app/core/hooks.py` – Event Bus: מנגנון `register(event, handler)` + `fire(event, **kwargs)` אסינכרוני
- [x] `app/core/tenant.py` – מודל `TenantConfig` (שם, לוגו, צבעים, מודולים פעילים)
- [x] endpoint `GET /api/v1/config` – מחזיר Manifest לפרונטנד
- [x] endpoint `PATCH /api/v1/config` – עדכון הגדרות Tenant

### Refactoring – פיצול המונולית
- [x] פיצול `app/api/v1/synagogue.py` + `app/services/synagogue_service.py` למודולים:
  - `app/modules/congregants/` – module.py, api.py, service.py, models.py
  - `app/modules/payments/` – module.py, api.py, service.py, models.py
  - `app/modules/aliyot/` – module.py, api.py, service.py, models.py
  - `app/modules/seating/` – module.py, api.py, service.py, models.py
  - `app/modules/calendar/` – module.py, api.py, service.py
  - `app/modules/llm/` – module.py, api.py, service.py (כלי LLM רשומים לפי מודול)
- [x] העברת `db_models.py` לתיקיות המודולים המתאימות (קובץ ישן נמחק לחלוטין)
- [x] החלפת Foreign Keys קשיחים ב-Soft IDs בין מודולים
- [x] עדכון `main.py` לטעינה דינמית מה-Registry
- [x] עדכון בדיקות אינטגרציה לארכיטקטורה החדשה (70 טסטים קיימים + 11 טסטים חדשים ל-config, registry ו-hooks)

### Frontend
- [x] `AppConfig` Context – נטען מ-`GET /config` ב-init (`AppConfigContext.tsx`)
- [x] `Sidebar.tsx` – רינדור דינמי לפי מודולים פעילים בלבד
- [x] `App.tsx` – עטוף ב-`AppConfigProvider`
- [x] CSS variables דינמיים מה-Tenant Config (`--color-indigo`, `--color-gold`, logo)

---

## 🔴 v2.1 – Prayer Schedule · לוח זמני תפילות

> **עדיפות:** הבא לפיתוח – צורך יומיומי של הגבאי.  
> **רעיון המפתח:** במקום "מנחה ב-17:30", הגבאי מגדיר "מנחה = 15 דקות לפני שקיעה". המערכת מחשבת אוטומטית.

### Backend
- [ ] מודל `PrayerRule` – `name`, `day_type`, `anchor` (שקיעה/הנץ/קבוע), `offset_minutes`, `is_active`
- [ ] `prayer_service.calculate_times(date)` – חישוב זמני תפילה ליום לפי כללים + zmanim
- [ ] `GET /synagogue/schedule?date=YYYY-MM-DD`
- [ ] `GET /synagogue/schedule/week?from=YYYY-MM-DD`
- [ ] CRUD `/synagogue/prayer-rules` (GET / POST / PATCH / DELETE)

### Frontend
- [ ] טאב "זמני בית הכנסת" בסייד-בר
- [ ] עורך כללים: הוספה/עריכה/מחיקה, בחירת עוגן מרשימה
- [ ] תצוגת לוח מחושב ליום ולשבוע – שעה בפועל לצד הכלל
- [ ] הפרדה ימי חול / שבת / יום טוב
- [ ] כרטיס "זמני היום" ב-Dashboard

### אינטגרציה
- [ ] כלי LLM: `get_prayer_times(date)`
- [ ] שילוב לוח הזמנים בלוח השבועי (v2.2)

---

## 🔴 v2.2 – Communication & Bulletin · תקשורת ולוח שבועי

> **עדיפות:** גבוהה – הגבאי שולח לוח שבועי כל שבוע.

### Backend
- [ ] מודל `BulletinConfig` – שם בית הכנסת, רב, כתובת, הכרזות חוזרות
- [ ] `bulletin_service` – אוסף פרשה, זמני שבת, אזכרות ושמחות לשבוע הקרוב
- [ ] `GET /bulletin?date=YYYY-MM-DD`
- [ ] 3 פורמטים: טקסט לוואטסאפ, HTML למייל (Google Groups), עמוד הדפסה A4
- [ ] בחירת קטעים להכלרה/הסרה לפי שבוע
- [ ] הגדרת שרת SMTP לשליחת תזכורות אוטומטיות במייל

### Frontend
- [ ] עמוד "לוח שבועי" – תצוגה מקדימה, עריכה, כפתורי העתקה והדפסה
- [ ] כפתור "שלח בוואטסאפ" ליד כל אזכרה/שמחה (הודעה מובנית)
- [ ] הגדרות SMTP בממשק

---

## 🟠 v2.3 – Financial Completeness · פיננסים מלא

> **עדיפות:** גבוהה – מאחד את הפן הפיננסי מ-2.5 ואת כל 2.7.

### Backend
- [ ] ניהול סטטוס תשלום: "התחייבות" (Pledge) לעומת "שולם"
- [ ] הפקת קבלות PDF מעוצבות (לוגו בית כנסת, פרטי תרומה)
- [ ] מודל `Expense` – הוצאה (תאריך, סכום, קטגוריה, תיאור, קישור לחשבונית)
- [ ] מודל `Income` – הכנסה שאינה תרומה (השכרת אולם, מכירת ספרים, מענקים)
- [ ] CRUD endpoints הוצאות: `GET/POST/PATCH/DELETE /synagogue/expenses`
- [ ] CRUD endpoints הכנסות: `GET/POST/PATCH/DELETE /synagogue/income`
- [ ] `GET /synagogue/reports/annual?year=` – דוח P&L מסכם
- [ ] ייצוא CSV: מתפללים + נתונים פיננסיים

### Frontend
- [ ] לשונית "התחייבויות/שולם" בדף תשלומים
- [ ] כפתור "הפק קבלה PDF" בדף תשלומים
- [ ] לשונית "הוצאות" – טבלה + הוספה/עריכה/מחיקה
- [ ] לשונית "הכנסות אחרות" – אותו מבנה
- [ ] לשונית "דוח שנתי" – P&L עם גרף עוגה/עמודות + כפתור ייצוא PDF
- [ ] כפתור "ייצא CSV" בדף מתפללים

---

## 🟠 v2.4 – Smart Gabai · גבאי חכם

> **עדיפות:** בינונית-גבוהה – חוסך זמן רב בשיבוץ עליות ובניהול מלאי.

### שיבוץ עליות חכם
- [ ] אלגוריתם הצעה: תדירות עליות, קרבת יארצייט/שמחה, סטטוס כהן/לוי/ישראל
- [ ] כלי LLM: `suggest_aliyot(parasha, date)`
- [ ] ווידג'ט "הצעות שיבוץ לשבת הקרובה" ב-Dashboard
- [ ] כפתור "הצע שיבוץ אוטומטי" בעמוד עליות

### ניהול מלאי
- [ ] מודל `InventoryItem` – פריט (שם, כמות, קטגוריה: ספרים/ציוד/כלי קודש, הערות)
- [ ] CRUD endpoints: `GET/POST/PATCH/DELETE /synagogue/inventory`
- [ ] דף "מלאי" בסייד-בר

### שדרוג LLM (2.0)
- [ ] Knowledge Base (RAG) – שאלות על בסיס מסמכי PDF (תקנון, נהלים, הלכות)
- [ ] שאילתות מורכבות: "מי לא עלה לתורה בחצי שנה האחרונה?"
- [ ] שילוב זמני הלכה בתוך תשובות הצ'אט

---

## 🔴 v3.0 – Production · אבטחה, אימות ופריסה

> **עדיפות:** חובה לפני שיתוף עם כל גורם חיצוני.  
> **תנאי מוקדם ל-v3.5:** מודל ה-JWT + מודל ה-Scope ב-LLM חייבים להיות מוכנים לפני בוט הוואטסאפ.

### אימות משתמשים – Backend
- [ ] מודל `User` במסד הנתונים (שם משתמש, סיסמה מוצפנת עם bcrypt)
- [ ] `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] JWT middleware על כל ה-endpoints

### אימות משתמשים – Frontend
- [ ] דף התחברות (Login page) בעברית RTL
- [ ] `AuthContext` / `useAuth`, Protected Routes
- [ ] Authorization header ב-`api/client.ts`
- [ ] כפתור התנתקות ב-Sidebar

### הכנה ל-v3.5 (WhatsApp Bot Prep)
- [ ] מודל LLM Scope: `role=admin` (כל הנתונים) vs `role=congregant, id=X` (מסונן לפי `congregant_id`)
- [ ] Rate limiting על `/auth/*` ו-`/llm/chat`

### אבטחה ופריסה
- [ ] Helmet / security headers ב-FastAPI
- [ ] `CORS_ORIGINS` לדומיין הסופי בלבד, `DEBUG=False`
- [ ] `Dockerfile` backend + `Dockerfile` frontend (nginx)
- [ ] `docker-compose.yml` (backend + frontend + db)
- [ ] `.env.production` + `docs/DEPLOYMENT.md`
- [ ] migration script מ-SQLite ל-PostgreSQL
- [ ] תיעוד נוהל גיבוי ידני של `gabay.db`

---

## 🟡 v3.5 – WhatsApp Bot · בוט וואטסאפ קהילתי

> **תלוי ב-v3.0** – נדרש: JWT Auth + LLM Scope model.  
> המוצר משרת גם את המתפללים עצמם – ללא אפליקציה, ללא הרשמה.

> **הערות טכניות:**
> - ה-API הרשמי: **WhatsApp Business Platform (Meta Cloud API)** – חינמי עד 1,000 שיחות/חודש
> - לפיתוח ובדיקות: **Twilio WhatsApp Sandbox** – פועל מיידית
> - זיהוי מתפלל: לפי `Congregant.phone` – אין צורך בהרשמה

### תשתית WhatsApp – Backend
- [ ] `app/modules/whatsapp/` – `api.py`, `service.py`
- [ ] `GET /webhooks/whatsapp` (verify) + `POST /webhooks/whatsapp` (receive)
- [ ] זיהוי מתפלל לפי `Congregant.phone`
- [ ] שימוש ב-LLM Scope `role=congregant` (מ-v3.0)

### Congregant Agent – LLM
- [ ] כלים מוגבלים: `get_my_payments`, `get_my_aliyot`, `get_my_azkara_reminders`, `get_upcoming_events`, `get_parasha_info`
- [ ] הגנה מפני Prompt Injection (SQL מסונן לפי `congregant_id` בשרת)

### הודעות יוצאות
- [ ] Template Messages לתזכורות אזכרה (D-7 ו-D-1)
- [ ] `POST /webhooks/broadcast` – שליחת עדכון לכלל המתפללים
- [ ] כפתור "שלח תזכורת בוואטסאפ" ממסך האזכרות

---

## 🟡 v3.6 – Visual Bulletin · לוח שבועי מעוצב (Canva-style)

> **מבוסס על v2.2** – שכבת עיצוב מעל הלוח השבועי הטקסטואלי.

### מנוע פריסה חכם
- [ ] אלגוריתם Auto-Scaling – גודל פונט ומרווחים לדף A4 בודד
- [ ] Dynamic Content Prioritization – סדר עדיפויות בעומס תוכן
- [ ] Live Print Preview – תצוגה מקדימה המדמה דף A4

### עיצוב ותבניות
- [ ] Theme Manager – ערכות נושא (חגים, שמחות, ימי חול)
- [ ] Background & Overlay Support – העלאת רקעים גרפיים
- [ ] Rich Text Editor – עורך טקסט עם הדגשות ואייקונים

### ייצוא והפצה
- [ ] High-Quality PDF Export – ייצוא וקטורי להדפסה
- [ ] Image Export (JPG/PNG) – לוואטסאפ וגוגל גרופס

---

## 🟢 v4.0 – SaaS Platform · Multi-tenancy ו-License System

> הבסיס המודולרי (Registry, Hooks, Tenant Config) נבנה ב-v1.5. גרסה זו מוסיפה את שכבת ה-SaaS.

### Multi-tenancy – Backend
- [ ] שדה `tenant_id` לכל המודלים
- [ ] Middleware שמזריק `tenant_id` לפי JWT / subdomain
- [ ] תמיכה ב-subdomain routing: `synagogue-a.gabay.app` → `tenant_id=a`
- [ ] תיעוד: DB-per-tenant לעומת shared DB עם Row-Level Security

### License System
- [ ] מודל `License` – תוכנית (Basic / Premium / Enterprise), תאריך תפוגה, מודולים מורשים
- [ ] `LicenseService` – אימות רישיון בעת הפעלה + בדיקת מודולים מורשים
- [ ] `POST /admin/licenses`

### Admin Panel
- [ ] דף Tenants (Super Admin בלבד)
- [ ] יצירה, עריכה, השבתה של בית כנסת
- [ ] ניהול רישיונות ומודולים פעילים לכל Tenant

---

## 🔵 v5.0 – QA + Mobile · איכות ואפליקציית מובייל

### E2E (Playwright)
- [ ] תשתית Playwright בתיקיית ה-Frontend
- [ ] Smoke Tests: Login → Dashboard
- [ ] תהליכי ליבה: יצירת מתפלל, רישום תשלום, הפקת דוח שנתי
- [ ] בדיקת רספונסיביות (מובייל, טאבלט) ונגישות בסיסית

### אפליקציית מובייל (React Native + Expo)
- [ ] **Phase 1:** Dashboard, חיפוש מתפלל, רישום תשלום, Push notifications (Firebase)
- [ ] **Phase 2:** LLM chat, עליות, אזכרות, לוח שנה עברי
- [ ] **Phase 3:** מצב Offline מלא, ביומטריה (Face ID / Fingerprint), פרסום ב-Google Play + App Store
