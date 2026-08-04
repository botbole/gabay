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
| **2.1** | **לוח זמני תפילות ושיעורים** | 🟡 ליבה הושלמה | Partial |
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

## 🟡 v2.1 – Prayer Schedule · לוח תפילות ושיעורים [CORE IMPLEMENTED]

> **סטטוס:** מודול הליבה פעיל ומחובר ל-Backend ול-Frontend. נותרו אינטגרציות Dashboard, LLM ו-v2.2 ובדיקות ייעודיות.  
> **רעיון המפתח:** במקום "מנחה ב-17:30", הגבאי מגדיר "מנחה = 15 דקות לפני שקיעה". המערכת מחשבת אוטומטית.

### Backend
- [x] מודל `PrayerRule` – כולל סוג יום, עוגן, היסט, זמן קבוע, טקסט חופשי, שיעור, ימי שבוע וסדר תצוגה
- [x] מודל `SpecialDay` + CRUD לימים מיוחדים לפי תאריך עברי
- [x] `prayer_schedule_service.calculate_times(date)` – חישוב זמני תפילה ושיעורים לפי כללים + zmanim
- [x] `GET /synagogue/schedule?date=YYYY-MM-DD`
- [x] `GET /synagogue/schedule/week?from_date=YYYY-MM-DD`
- [x] `GET /synagogue/schedule/generate` – יצירת טקסט לוח שבועי להעתקה
- [x] CRUD `/synagogue/prayer-rules` + שינוי סדר בגרירה
- [x] רישום המודול ב-Registry, ב-`ENABLED_MODULES`, ב-`ALL_MODULES` ובמסד הפעיל

### Frontend
- [x] טאב "לוח תפילות ושיעורים" בסייד-בר וב-Header
- [x] עורך כללים: הוספה/עריכה/מחיקה, בחירת עוגן, זמן קבוע, היסט וטקסט חופשי
- [x] תצוגה מקדימה חיה לפי תאריך עם השעה המחושבת לצד כל כלל
- [x] הפרדה בין יום חול / שבת / יום טוב / ראש השנה / יום כיפור / יום מיוחד
- [x] שיעורים בצבע ירוק, בחירת ימי שבוע ותיאור זמן חופשי
- [x] Drag & Drop, מיון אוטומטי לפי זמן ויצירת לוח שבועי להעתקה
- [ ] כרטיס "זמני היום" ב-Dashboard

### אינטגרציה
- [ ] כלי LLM: `get_prayer_times(date)`
- [ ] שילוב לוח הזמנים בלוח השבועי (v2.2)
- [ ] בדיקות אינטגרציה ייעודיות ל-CRUD, חישוב עוגנים, חגים ושבוע

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
> **אסטרטגיית פריסה מומלצת:** Docker מקומי + שירות Containers מנוהל בענן + PostgreSQL מנוהל. Kubernetes אינו נדרש בשלב זה; הוא ייבחן ב-v4.0 כאשר יהיה צורך ב-SaaS, ריבוי מופעים או High Availability.

### שלב 0 – החלטות ארכיטקטורה ו-Baseline
- [ ] הגדרת endpoints ציבוריים בלבד: `/health`, התחברות, refresh ו-bootstrap חד-פעמי
- [ ] הגדרת Roles: `admin` ו-`congregant` עם `congregant_id` אופציונלי
- [ ] הרצת ושמירת baseline: כל בדיקות ה-Backend, `npm run lint` ו-`npm run build`
- [ ] בחירת ספק ענן סופי ושירות Containers מנוהל (Azure Container Apps / AWS ECS Fargate / Google Cloud Run)

### שלב 1 – אימות משתמשים מקומי: Backend
- [ ] מודול `app/modules/auth/` לפי מבנה Registry הקיים
- [ ] מודל `User`: שם משתמש ייחודי, password hash עם bcrypt, role, active ו-`congregant_id`
- [ ] מודל `RefreshSession`: hash של refresh token, תפוגה, ביטול ו-token family
- [ ] Bootstrap חד-פעמי למנהל הראשון; לאחר מכן יצירת משתמשים על ידי Admin בלבד
- [ ] `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] Access JWT קצר-חיים + Refresh token מסתובב עם reuse detection וביטול ב-logout
- [ ] הגדרות `JWT_SECRET`, issuer, audience, זמני תפוגה ו-cookie security ב-`app/core/config.py`
- [ ] `get_current_user` ו-`require_admin` כ-FastAPI dependencies
- [ ] הגנה על כל ה-Routers; השארת allowlist ציבורי מפורש בלבד
- [ ] הגנת service-level לפעולות רגישות שנקראות גם מכלי LLM
- [ ] Alembic baseline ומיגרציות מפורשות לפני מעבר למסד Production
- [ ] `tests/test_auth.py` + התאמת fixtures קיימים ל-client מאומת

### שלב 2 – אימות משתמשים מקומי: Frontend
- [ ] דף התחברות (Login page) בעברית RTL
- [ ] `AuthContext` / `useAuth` + Protected Routes ו-redirect ל-`/login`
- [ ] Access token בזיכרון; Refresh token ב-`HttpOnly Secure SameSite` cookie
- [ ] Authorization header מרכזי ב-`api/client.ts`, כולל העלאות FormData/CSV
- [ ] מנגנון refresh יחיד, retry פעם אחת בלבד וטיפול אחיד ב-401
- [ ] כפתור התנתקות ופרטי משתמש ב-Sidebar
- [ ] ניקוי TanStack Query cache בהתנתקות

### שלב 3 – Authorization, LLM Scope ו-Rate Limiting
- [ ] מודל Scope בצד השרת: `role=admin` מול `role=congregant, congregant_id=X`
- [ ] רשימת כלי LLM נפרדת לפי Scope
- [ ] סינון `congregant_id` בשכבת Service/DB ולא רק ב-Prompt
- [ ] בדיקות המוכיחות שמתפלל אינו יכול לקרוא או לשנות נתונים של מתפלל אחר
- [ ] Rate limiting נפרד ל-login כושל, refresh ו-`/llm/chat`
- [ ] תשובת `429` אחידה ללא חשיפת קיום שם משתמש

### שלב 4 – Security Hardening
- [ ] Security headers ב-FastAPI: HSTS תחת HTTPS, CSP, frame denial, nosniff ו-referrer policy
- [ ] `CORS_ORIGINS` לדומיין הסופי בלבד; ללא wildcard כאשר cookies פעילים
- [ ] `DEBUG=False` ב-Production וכיבוי Swagger/ReDoc ושגיאות מפורטות
- [ ] ולידציית startup שעוצרת Production עם JWT secret חלש או חסר
- [ ] Structured logs עם request ID וללא tokens, cookies, סיסמאות, מפתחות LLM או מידע אישי
- [ ] הגבלת Google Sheets import לכתובות Google HTTPS מאושרות, timeout וגודל תגובה
- [ ] SCA, source scan, secret scan ו-container scan כחלק מה-CI

### שלב 5 – Docker לסביבת פיתוח ואינטגרציה
- [ ] `Dockerfile` רב-שלבי ל-Backend, הרצה כמשתמש non-root
- [ ] `frontend/Dockerfile` רב-שלבי: Vite build + nginx
- [ ] `frontend/nginx.conf`: SPA fallback, proxy ל-`/api`, compression ו-security limits
- [ ] `docker-compose.yml`: Frontend + Backend + PostgreSQL עם health checks ו-volumes
- [ ] `.dockerignore` ללא `.env`, מסדי נתונים מקומיים, caches ו-`graphify-out`
- [ ] בדיקת `docker compose up` מקומית: login, CRUD, refresh, logout ושמירת נתונים לאחר restart

### שלב 6 – PostgreSQL והעברת נתונים
- [ ] PostgreSQL driver ותיקון `app/core/db.py` כך ש-`check_same_thread` יוגדר ל-SQLite בלבד
- [ ] PostgreSQL מקומי ב-Compose; בענן להשתמש ב-Managed PostgreSQL ולא להריץ DB בתוך container/Kubernetes
- [ ] `scripts/migrate_sqlite_to_postgres.py` עם dry-run, יעד ריק, transaction ושמירת IDs
- [ ] אימות row counts, Foreign Keys, sequences ודגימות נתונים לאחר migration
- [ ] חזרה מלאה על migration מעותק של `gabay.db` לפני cutover
- [ ] שמירת SQLite המקורי כ-read-only עד לאחר backup + restore מוצלחים ב-PostgreSQL

### שלב 7 – תשתית ענן חסכונית
- [ ] Container Registry פרטי ל-Backend ול-Frontend
- [ ] שירות Containers מנוהל עם scale-to-zero/scale-down כאשר נתמך
- [ ] Managed PostgreSQL ברשת פרטית, ללא port ציבורי
- [ ] Secret Manager עבור JWT, DB credentials ו-LLM API key; אין `.env.production` אמיתי ב-Git
- [ ] Domain + TLS, reverse proxy/load balancer ו-trusted forwarded headers
- [ ] Staging נפרד מ-Production עם DB וסודות נפרדים
- [ ] `.env.production.example` עם placeholders בלבד
- [ ] `docs/DEPLOYMENT.md`: provisioning, bootstrap admin, deploy, migrate, rollback ו-troubleshooting

### שלב 8 – CI/CD לענן
- [ ] GitHub Actions ב-Pull Request: Backend tests, Frontend lint/build, migration validation וסריקות אבטחה
- [ ] לאחר merge/tag: בניית images, סריקה, tagging לפי commit SHA ו-push ל-Registry
- [ ] פריסה אוטומטית ל-Staging + migration job חד-פעמי + smoke tests
- [ ] אישור ידני לפני Production
- [ ] Production deploy מדורג, readiness check ו-rollback אוטומטי ל-image הקודם בכשל
- [ ] מיגרציות DB backward-compatible לפני החלפת גרסת האפליקציה
- [ ] שמירת artifacts ו-deployment history לצורכי audit

### שלב 9 – גיבוי, ניטור ותפעול
- [ ] `docs/BACKUP.md`: גיבוי ידני בטוח של `gabay.db`, integrity check והצפנה
- [ ] גיבוי אוטומטי של PostgreSQL, retention ואחסון off-site
- [ ] תרגיל restore מתועד לסביבה חדשה; גיבוי שלא שוחזר אינו נחשב מאומת
- [ ] `/health/live` לתהליך ו-`/health/ready` לחיבור DB ללא קריאת LLM חיצונית
- [ ] Error tracking, uptime monitor והתראות לכשלי readiness, migration ו-backup
- [ ] Runbook לתקלות, שחזור, החלפת secrets ו-rollback

### Kubernetes – החלטה מפורשת
- [ ] לא נדרש ל-v3.0: שירות Containers מנוהל נותן יחס עלות/תועלת טוב יותר למופע קטן
- [ ] בחינה מחדש ב-v4.0 עבור multi-tenancy, מספר replicas, autoscaling מורכב ו-High Availability
- [ ] אם יידרש: Helm chart, Deployments, Services, Ingress, Secrets, migration Job, HPA ו-PDB

### Definition of Done
- [ ] ללא JWT כל endpoint רגיש מחזיר `401`; משתמש ללא הרשאה מקבל `403`
- [ ] logout מבטל refresh session ושימוש חוזר ב-refresh token מבטל את ה-token family
- [ ] Scope של מתפלל נאכף ב-DB גם תחת Prompt Injection
- [ ] CORS, Rate Limit, Security Headers וכיבוי docs נבדקו אוטומטית
- [ ] Compose מקומי ו-Staging בענן עוברים smoke test מלא
- [ ] migration, backup ו-restore נוסו בהצלחה על עותק נתונים אמיתי
- [ ] Pipeline ירוק ו-Production deploy ניתן ל-rollback ללא איבוד נתונים

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
