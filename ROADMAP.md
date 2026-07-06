# ROADMAP – גבאי

מסמך זה מפרק את הפיתוח לאבני דרך. הצ'קבוקסים משקפים את המצב בפועל בקוד.

---

## סדר עדיפויות – סיכום

| Milestone | נושא | עדיפות | סטטוס |
|---|---|---|---|
| 1 | MVP – ניהול קהילה בסיסי | ✅ הושלם | Done |
| 2 | Core – לוח שנה + LLM | ✅ הושלם | Done |
| Infra | בדיקות אינטגרציה | ✅ הושלם | Done |
| **1.5** | **תשתית מודולרית – Refactoring** | ✅ **הושלם** | Done |
| **3** | **Production – Auth + Docker** | 🔴 **גבוהה מאוד** | Pending |
| 2.5 | כספים + תקשורת + LLM 2.0 | 🟠 גבוהה | Pending |
| 2.6 | לוח זמני תפילות חכם | 🟠 גבוהה | Pending |
| 2.7 | ניהול פיננסי מלא + דוחות | 🟠 גבוהה | Pending |
| 3.5 | בוט וואטסאפ קהילתי | 🟡 בינונית | Pending |
| 2.8 | שיבוץ עליות חכם + מלאי | 🟡 בינונית | Pending |
| 2.9 | לוח שבועי מעוצב (Canva) | 🟡 בינונית | Pending |
| 4 | Multi-tenancy + License System | 🟢 SaaS | Pending |
| 5 | QA + בדיקות E2E | 🟢 יציבות | Pending |
| **6** | **אפליקציית מובייל – Android + iOS** | 🔵 עתידי | Future |

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
- [x] העברת `db_models.py` לתיקיות המודולים המתאימות (קובץ ישן כ-shim)
- [x] החלפת Foreign Keys קשיחים ב-Soft IDs בין מודולים
- [x] עדכון `main.py` לטעינה דינמית מה-Registry
- [x] עדכון בדיקות אינטגרציה לארכיטקטורה החדשה (70 טסטים קיימים + 11 טסטים חדשים ל-config, registry ו-hooks)

### Frontend
- [x] `AppConfig` Context – נטען מ-`GET /config` ב-init (`AppConfigContext.tsx`)
- [x] `Sidebar.tsx` – רינדור דינמי לפי מודולים פעילים בלבד
- [x] `App.tsx` – עטוף ב-`AppConfigProvider`
- [x] CSS variables דינמיים מה-Tenant Config (`--color-indigo`, `--color-gold`, logo)

---

## 🔴 Milestone 3 – Production · אבטחה, אימות ופריסה

> **עדיפות:** גבוהה מאוד – אי אפשר להפיץ את המוצר ללא אימות משתמשים ו-Docker.

### אימות משתמשים – Backend
- [ ] מודל `User` במסד הנתונים (שם משתמש, סיסמה מוצפנת עם bcrypt)
- [ ] endpoint הרשמה / יצירת משתמש ראשוני (`POST /auth/register`)
- [ ] endpoint התחברות עם החזרת JWT (`POST /auth/login`)
- [ ] middleware לאימות JWT על כל ה-endpoints
- [ ] endpoint רענון טוקן (`POST /auth/refresh`)
- [ ] endpoint התנתקות / ביטול טוקן (`POST /auth/logout`)

### אימות משתמשים – Frontend
- [ ] דף התחברות (Login page) בעברית RTL
- [ ] שמירת JWT ב-`localStorage` / `httpOnly cookie`
- [ ] Protected Routes – הפניה לדף התחברות עבור משתמש לא מזוהה
- [ ] `AuthContext` / `useAuth` hook לניהול מצב ההתחברות
- [ ] הוספת Authorization header לכל קריאות ה-API Client
- [ ] כפתור התנתקות ב-Sidebar

### הקשחה ואבטחה
- [ ] Rate limiting על endpoints רגישים (התחברות, LLM chat)
- [ ] Helmet / security headers ב-FastAPI
- [ ] הגדרת `CORS_ORIGINS` בסביבת production לדומיין הסופי בלבד
- [ ] אסור להחזיר stack traces בשגיאות production (`DEBUG=False`)

### גיבוי ונתונים
- [ ] endpoint ייצוא מתפללים ל-CSV (`GET /synagogue/congregants/export/csv`)
- [ ] תיעוד נוהל גיבוי ידני של קובץ `gabay.db`
- [ ] migration script למעבר מ-SQLite ל-PostgreSQL בייצור

### פריסה (Deployment)
- [ ] `Dockerfile` לשרת ה-Backend (עם `ENABLED_MODULES` ENV)
- [ ] `Dockerfile` לבנייה ו-serve של ה-Frontend (nginx)
- [ ] `docker-compose.yml` לסביבה מלאה (backend + frontend + db)
- [ ] הגדרת משתני סביבה לייצור (`.env.production`)
- [ ] תיעוד פריסה ב-`docs/DEPLOYMENT.md`

---

## 🟠 Milestone 2.5 – Advanced Gabay · כספים, תקשורת ובינה מלאכותית מתקדמת

יעד: הפיכת המערכת לכלי עבודה שלם המנהל את הקשר עם המתפלל ואת הצד הפיננסי בצורה מקצועית.

### ניהול כספים וקבלות
- [ ] הפקת קבלות PDF מעוצבות (לוגו בית כנסת, פרטי תרומה)
- [ ] ניהול סטטוס תשלום: "התחייבות" (Pledge) לעומת "שולם"
- [ ] דוחות כספיים תקופתיים (אקסל/PDF) לפי מטרה ותאריך
- [ ] ייצוא רשימת מתפללים ל-CSV (`GET /synagogue/congregants/export/csv`)

### מרכז תקשורת (Communication Hub)
- [ ] כפתור "שלח בוואטסאפ" מהיר ליד אזכרות ושמחות (הודעה מובנית)
- [ ] מחולל "הודעה שבועית" (זמני תפילות, פרשה, אירועים) להעתקה והפצה
- [ ] הגדרת שרת SMTP לשליחת תזכורות אוטומטיות במייל

### לוח שבועי דינמי (Weekly Bulletin)
- [ ] מודול `bulletin_service` – אוסף פרשה, זמני שבת, אזכרות ושמחות לשבוע הקרוב
- [ ] 3 פורמטים ליצוא: טקסט לוואטסאפ, HTML למייל (Google Groups), עמוד הדפסה (A4)
- [ ] עמוד "לוח שבועי" בממשק הגבאי – תצוגה מקדימה, עריכה, כפתורי העתקה והדפסה
- [ ] מודל `BulletinConfig` – הגדרות קבועות: שם בית הכנסת, רב, כתובת, הכרזות חוזרות
- [ ] בחירת קטעים להכלרה/הסרה לפי שבוע

### שדרוג הגבאי הדיגיטלי (LLM 2.0)
- [ ] Knowledge Base (RAG) – תמיכה בשאלות על בסיס מסמכי PDF (תקנון, נהלים, הלכות)
- [ ] שאילתות מורכבות (למשל: "מי לא עלה לתורה בחצי שנה האחרונה?")
- [ ] שילוב זמני הלכה (זמני היום) בתוך תשובות הצ'אט

---

## 🟠 Milestone 2.6 – Synagogue Schedule · לוח זמנים חכם לבית הכנסת

יעד: מודול ניהול זמני תפילות ושיעורים המבוסס על **כללים** ולא על שעות קבועות.

> **רעיון המפתח:** במקום "מנחה ב-17:30", הגבאי מגדיר "מנחה = 15 דקות לפני שקיעה". המערכת מחשבת אוטומטית.

### מנוע הכללים (Rules Engine) – Backend
- [ ] מודל `PrayerRule` – `name`, `day_type`, `anchor`, `offset_minutes`, `fixed_time`, `is_active`
- [ ] `prayer_service.calculate_times(date)` – חישוב זמני תפילה ליום לפי כללים + zmanim
- [ ] endpoint `GET /synagogue/schedule?date=YYYY-MM-DD`
- [ ] endpoint `GET /synagogue/schedule/week?from=YYYY-MM-DD`
- [ ] CRUD endpoints לניהול כללים (`GET/POST/PATCH/DELETE /synagogue/prayer-rules`)

### ממשק ניהול – Frontend
- [ ] טאב "זמני בית הכנסת" בממשק הגבאי
- [ ] עורך כללים: הוספה/עריכה/מחיקה עם בחירת עוגן מרשימה
- [ ] תצוגת לוח מחושב ליום ולשבוע עם שעות בפועל לצד הכלל
- [ ] הפרדה בין ימי חול / שבת / יום טוב

### אינטגרציה עם מודולים אחרים
- [ ] שילוב לוח הזמנים בלוח השבועי (Bulletin)
- [ ] כלי LLM `get_prayer_times(date)`
- [ ] תצוגת זמנים ב-Dashboard (כרטיס "זמני היום")

---

## 🟠 Milestone 2.7 – Financials & Reports · ניהול פיננסי ודוחות

יעד: תמונה כלכלית מלאה לוועד בית הכנסת מעבר לתרומות בלבד.

### Backend
- [ ] מודל `Expense` – הוצאה (תאריך, סכום, קטגוריה, תיאור, קישור לחשבונית)
- [ ] מודל `Income` – הכנסה שאינה תרומה (השכרת אולם, מכירת ספרים, מענקים)
- [ ] CRUD endpoints להוצאות (`GET/POST/PATCH/DELETE /synagogue/expenses`)
- [ ] CRUD endpoints להכנסות (`GET/POST/PATCH/DELETE /synagogue/income`)
- [ ] endpoint דוח שנתי: `GET /synagogue/reports/annual?year=` – P&L מסכם
- [ ] endpoint ייצוא ל-CSV / PDF

### Frontend
- [ ] טאב "ניהול כלכלי" בדף תשלומים (או דף עצמאי)
  - לשונית "הוצאות" – טבלת רשומות + הוספה/עריכה/מחיקה
  - לשונית "הכנסות אחרות" – אותו מבנה
  - לשונית "דוח שנתי" – תצוגת P&L עם גרף עוגה/עמודות
- [ ] כפתור "ייצא ל-PDF" לדוח השנתי

---

## 🟡 Milestone 3.5 – WhatsApp Bot · בוט וואטסאפ קהילתי

יעד: המוצר משרת גם את המתפללים עצמם – ללא אפליקציה, ללא הרשמה.

> **הערות טכניות:**
> - ה-API הרשמי: **WhatsApp Business Platform (Meta Cloud API)** – חינמי עד 1,000 שיחות/חודש
> - לפיתוח ובדיקות: **Twilio WhatsApp Sandbox** – פועל מיידית
> - זיהוי מתפלל: לפי `Congregant.phone` – אין צורך בהרשמה

### תשתית WhatsApp – Backend
- [ ] משתני סביבה: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`
- [ ] `app/modules/whatsapp/api.py` עם `GET /webhooks/whatsapp` + `POST /webhooks/whatsapp`
- [ ] `app/modules/whatsapp/service.py` – שליחה וקבלה דרך Meta Cloud API / Twilio
- [ ] זיהוי מתפלל לפי מספר טלפון

### Congregant Agent – LLM
- [ ] פרומפט מוגבל: עונה למתפלל על הנתונים שלו בלבד
- [ ] כלים: `get_my_payments`, `get_my_aliyot`, `get_my_azkara_reminders`, `get_upcoming_events`, `get_parasha_info`
- [ ] הגנה מפני Prompt Injection: SQL מסונן לפי `congregant_id` בשרת

### הודעות יוצאות (Outbound / Broadcast)
- [ ] Template Messages לתזכורות אזכרה (D-7 ו-D-1)
- [ ] `POST /webhooks/broadcast` – שליחת עדכון לכלל המתפללים
- [ ] כפתור "שלח תזכורת בוואטסאפ" ממסך האזכרות

---

## 🟡 Milestone 2.8 – Smart Aliyot & Inventory · שיבוץ חכם ומלאי

### שיבוץ עליות חכם (Smart Aliya Engine)
- [ ] אלגוריתם הצעה: מבוסס תדירות עליות, קרבת יארצייט/שמחה, סטטוס כהן/לוי/ישראל
- [ ] כלי LLM חדש `suggest_aliyot(parasha, date)`
- [ ] ווידג'ט "הצעות שיבוץ לשבת הקרובה" ב-Dashboard
- [ ] עמוד עליות: כפתור "הצע שיבוץ אוטומטי"

### ניהול מלאי (Inventory)
- [ ] מודל `InventoryItem` – פריט (שם, כמות, קטגוריה: ספרים/ציוד/כלי קודש, הערות)
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /synagogue/inventory`)
- [ ] דף "מלאי" בסייד-בר עם טבלה + הוספה/עריכה

---

## 🟡 Milestone 2.9 – Visual Bulletin & Publishing · לוח שבועי מעוצב

יעד: לוח שבועי ברמה מקצועית (Canva-style), התאמה אוטומטית לדף A4.

### מנוע פריסה חכם (Smart Layout Engine)
- [ ] אלגוריתם Auto-Scaling – גודל פונט ומרווחים לדף A4 בודד
- [ ] Dynamic Content Prioritization – סדר עדיפויות בעומס תוכן
- [ ] Live Print Preview – תצוגה מקדימה המדמה דף A4

### עיצוב ותבניות (Design & Themes)
- [ ] Theme Manager – ערכות נושא (חגים, שמחות, ימי חול)
- [ ] Background & Overlay Support – העלאת רקעים גרפיים
- [ ] Rich Text Editor – עורך טקסט עם הדגשות ואייקונים

### ייצוא והפצה
- [ ] High-Quality PDF Export – ייצוא וקטורי להדפסה
- [ ] Image Export (Social Share) – JPG/PNG לוואטסאפ וגוגל גרופס

---

## 🟢 Milestone 4 – SaaS Platform · Multi-tenancy ו-License System

יעד: הפיכת Gabay לפלטפורמה מסחרית מלאה עם הפרדת נתונים בין בתי כנסת ומנגנון רישיונות.

> **הערה:** הבסיס המודולרי (Registry, Hooks, Tenant Config) נבנה ב-Milestone 1.5.  
> מילסטון זה מוסיף את שכבת ה-SaaS מעל אותה תשתית.

### Multi-tenancy – Backend
- [ ] הוספת שדה `tenant_id` לכל המודלים
- [ ] Middleware שמזריק `tenant_id` לכל שאילתת DB לפי JWT / subdomain
- [ ] תמיכה ב-subdomain routing: `synagogue-a.gabay.app` → `tenant_id=a`
- [ ] תיעוד: DB-per-tenant (SQLite) לעומת shared DB עם Row-Level Security

### License System
- [ ] מודל `License` – תוכנית (Basic / Premium / Enterprise), תאריך תפוגה, מודולים מורשים
- [ ] `LicenseService` – אימות רישיון בעת הפעלה + בדיקת מודולים מורשים
- [ ] Admin endpoint ליצירת רישיונות (`POST /admin/licenses`)

### Admin Panel
- [ ] דף ניהול Tenants (Super Admin בלבד)
- [ ] יצירה, עריכה, השבתה של בית כנסת
- [ ] ניהול רישיונות ומודולים פעילים לכל Tenant

---

## 🟢 Milestone 5 – Quality Assurance · הבטחת איכות ואוטומציה

יעד: יציבות הממשק לפני הפצה רחבה.

### תשתית E2E
- [ ] הקמת תשתית Playwright בתיקיית ה-Frontend
- [ ] כתיבת Smoke Tests למסלולים קריטיים (Login → Dashboard)
- [ ] בדיקות תהליכי ליבה:
  - יצירת מתפלל ובדיקה שמופיע בטבלה
  - רישום תשלום ווידוא עדכון היתרה
  - הפקת דוח שנתי ובדיקת הורדת הקובץ
- [ ] בדיקת רספונסיביות: מובייל וטאבלט
- [ ] בדיקת נגישות (Accessibility) בסיסית

---

## 🔵 Milestone 6 – Mobile Application · אפליקציית Android + iOS

יעד: הגבאי מנהל את הקהילה מכף ידו – בכל מקום ובכל זמן, כולל תוך כדי תפילה.

> **גישה:** React Native + Expo – קוד בסיס אחד לשתי פלטפורמות, שימוש חוזר מלא ב-API הקיים.

### Phase 1 – MVP Mobile
- [ ] התקנת תשתית React Native + Expo
- [ ] אימות ביומטרי (Face ID / Fingerprint) + JWT
- [ ] Dashboard עם סטטיסטיקות קהילתיות
- [ ] חיפוש מהיר של מתפלל ועיון בפרופיל
- [ ] רישום תשלום ועלייה בלחיצה אחת
- [ ] התראות Push לאזכרות ושמחות קרובות (D-7, D-1) דרך Firebase

### Phase 2 – Full Feature Parity
- [ ] גישה לצ'אט עם הגבאי הדיגיטלי (LLM)
- [ ] ניהול עליות, אזכרות ושמחות
- [ ] תצוגת לוח שנה עברי
- [ ] שליחת הודעות וואטסאפ מהאפליקציה

### Phase 3 – Advanced
- [ ] מצב Offline מלא – קריאה ממטמון מקומי ללא חיבור
- [ ] סנכרון רקע (Background Sync) כשמתחבר לרשת
- [ ] פרסום ב-Google Play Store ו-Apple App Store
