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
| **2.1** | **לוח זמני תפילות ושיעורים** | ✅ הושלם | Done |
| **2.2** | **תקשורת ולוח שבועי** | 🟡 ליבה הושלמה | Partial |
| **2.3** | **פיננסים מלא** *(ממזג 2.5+2.7)* | 🟠 גבוהה | Pending |
| **2.4** | **גבאי חכם** *(שיבוץ + מלאי + LLM 2.0)* | 🟠 בינונית-גבוהה | Pending |
| **2.5** | **הגדרות מערכת** *(Settings Page)* | 🟠 גבוהה | Pending |
| **3.0** | **Production – Auth + Deploy** | 🔴 לפני שיתוף | Pending |
| **3.1** | **התקנה ו-Onboarding** *(Installation & First Run)* | 🔴 לפני בית כנסת שני | Pending |
| **3.2** | **פלטפורמת תמיכה** *(Support Platform)* | 🔴 לפני בית כנסת שני | Pending |
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

## 🟡 v2.1 – Prayer Schedule · לוח תפילות ושיעורים [DONE]

> **סטטוס:** מודול הליבה פעיל, כולל כרטיס Dashboard, כלי LLM ובדיקות. שילוב בלוח השבועי מכוסה ב-v2.2.  
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
- [x] כרטיס "זמני היום" ב-Dashboard

### אינטגרציה
- [x] כלי LLM: `get_prayer_times(date)`
- [x] שילוב לוח הזמנים בלוח השבועי (v2.2)
- [x] בדיקות אינטגרציה ייעודיות ל-CRUD, חישוב עוגנים, חגים ושבוע

---

## 🟡 v2.2 – Communication & Bulletin · תקשורת ולוח שבועי [CORE IMPLEMENTED]

> **עדיפות:** גבוהה – הגבאי שולח לוח שבועי כל שבוע.  
> **סטטוס:** לוח שבועי עם תצוגה מקדימה, העתקה, הדפסה וקישור wa.me. שליחת מייל SMTP נדחתה.

### Backend
- [x] מודל `BulletinConfig` – שם בית הכנסת, רב, כתובת, הכרזות חוזרות
- [x] `bulletin_service` – אוסף פרשה, זמני שבת, אזכרות ושמחות לשבוע הקרוב
- [x] `GET /bulletin?date=YYYY-MM-DD`
- [x] 3 פורמטים: טקסט לוואטסאפ, HTML למייל (Google Groups), עמוד הדפסה A4
- [x] בחירת קטעים להכלרה/הסרה לפי שבוע
- [ ] הגדרת שרת SMTP לשליחת תזכורות אוטומטיות במייל

### Frontend
- [x] עמוד "לוח שבועי" – תצוגה מקדימה, עריכה, כפתורי העתקה והדפסה
- [x] כפתור "שלח בוואטסאפ" ליד כל אזכרה/שמחה (הודעה מובנית)
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

## 🟠 v2.5 – Settings · הגדרות מערכת

> **עיקרון:** מוצר מקצועי שרץ על בתי כנסת מרובים חייב להפריד בין הגדרות גלובליות להגדרות מודול-ספציפיות. דף ההגדרות הוא הממשק של מנהל המערכת לכל הגדרה הרוחבית.  
> **תלויות:** Auth (v3.0) קיים — הנתיב `/settings` נחסם ל-`admin` בלבד.

### ארכיטקטורת תפקידים – ארבעה שכבות

```
Tier 0 – Super-Admin (צוות המוצר / תמיכה)   → גישה לכל הבתי כנסת, פאנל תמיכה
Tier 1 – Admin (מנהל הבית כנסת)              → דף הגדרות, ניהול גבאים
Tier 2 – Gabai (גבאי, 1–3 לבית כנסת)        → כל העבודה השוטפת, ללא גישה להגדרות
Tier 3 – Congregant / מתפלל (v3.5)           → שירות עצמי WhatsApp בלבד
```

- מנהל מערכת הוא ראש הגבאים / איש הקשר הטכני. ייתכנו 1–3 גבאים ללא הרשאת הגדרות.
- `super_admin` הוא תפקיד פלטפורמה (צוות גבאי) — ניהול בין-בתי-כנסת, לא גישה שגרתית.

### Backend

- [ ] הוספת `super_admin` ל-`UserRole` enum ב-`app/modules/auth/models.py`
- [ ] הרחבת `TenantConfig` ב-`app/core/tenant.py`:
  - שדות LLM: `llm_provider`, `llm_model`, `llm_api_key` (מוצפן), `llm_base_url`
  - שדות מיקום: `zmanim_city_name`, `zmanim_geoname_id`
  - שדות onboarding: `setup_completed` (boolean)
- [ ] מיגרציה ב-`app/core/db.py` לכל עמודה חדשה (try/except pattern קיים)
- [ ] `GET /api/v1/config` — ציבורי: מחזיר branding בלבד לפני login; admin: מחזיר את הכל (llm_api_key מוסתר)
- [ ] `PATCH /api/v1/config` — admin בלבד; כל שדה מאומת בנפרד
- [ ] `GET /api/v1/config/test-llm` — admin בלבד; בודק חיבור ל-LLM provider ומחזיר status
- [ ] `app/core/llm.py` — לקרוא מ-`TenantConfig` ראשית, fallback ל-`.env` (תאימות לאחור)
- [ ] `app/core/zmanim.py` — לקרוא מ-`TenantConfig` ראשית, fallback ל-`.env`

### Frontend

- [ ] נתיב `/settings` — נחסם ל-`admin` בלבד; גבאים לא רואים קישור בסייד-בר
- [ ] **טאב 1 – פרופיל בית הכנסת:** שם, לוגו (העלאת קובץ), צבע ראשי, צבע משני, צבע רקע
- [ ] **טאב 2 – מיקום ושעות תפילה:** שם עיר, Geoname ID, תצוגה מקדימה חיה של זמן הדלקת נרות / הבדלה
- [ ] **טאב 3 – עוזר AI:** בחירת ספק (OpenAI / Azure / Ollama), שדה מודל, מפתח API (masked), Base URL (מותנה), כפתור "בדוק חיבור"
- [ ] **טאב 4 – משתמשים:** טבלת גבאים (שם, תפקיד, כניסה אחרונה, סטטוס), הזמנה, השבתה, שינוי תפקיד
- [ ] **טאב 5 – עזרה ותמיכה:** גרסת האפליקציה, קישור ל-Changelog, קישור לתיעוד, ערוץ יצירת קשר לתמיכה
- [ ] **Onboarding Banner:** אם `setup_completed=false`, מציג סרגל הדרכה בראש כל עמוד עם שלבים: "הגדר פרופיל → הגדר מיקום → הגדר AI → הזמן גבאי"

### ניידות נתונים (Data Portability)

- [ ] `GET /api/v1/export/all` — admin בלבד; מייצא את כל נתוני הבית כנסת כ-JSON (מתפללים, תשלומים, עליות, מושבים, אזכרות, שמחות)
- [ ] קישור "ייצא את כל הנתונים" בטאב עזרה ותמיכה

### בדיקות

- [ ] `tests/test_settings.py` — גישת admin לכל שדות TenantConfig; גבאי מקבל 403 על PATCH; super_admin עובר
- [ ] בדיקת fallback: כאשר `llm_api_key` ריק ב-TenantConfig — מערכת עוברת ל-.env ולא נופלת

---

## 🔴 v3.0 – Production · אבטחה, אימות ופריסה

> **עדיפות:** חובה לפני שיתוף עם כל גורם חיצוני.  
> **תנאי מוקדם ל-v3.5:** מודל ה-JWT + מודל ה-Scope ב-LLM חייבים להיות מוכנים לפני בוט הוואטסאפ.
> **אסטרטגיית פריסה מומלצת:** Docker מקומי + שירות Containers מנוהל בענן + PostgreSQL מנוהל. Kubernetes אינו נדרש בשלב זה; הוא ייבחן ב-v4.0 כאשר יהיה צורך ב-SaaS, ריבוי מופעים או High Availability.

### שלב 0 – החלטות ארכיטקטורה ו-Baseline
- [x] הגדרת endpoints ציבוריים בלבד: `/health`, `GET /api/v1/config`, התחברות, refresh ו-bootstrap חד-פעמי
- [x] מודל ה-Roles הקיים בקוד: `admin` ו-`congregant`, עם `congregant_id` אופציונלי ב-`User`
- [x] הרחבת מודל היעד לשלושה Roles: `admin`, `gabai`, `congregant`
- [x] הרצת ושמירת baseline: Backend (`92 passed`), Frontend lint ו-production build
- [x] בחירת ספק ענן סופי: AWS ECS Fargate + Amazon RDS PostgreSQL

#### מודל הרשאות יעד

יש להבחין בין **ישויות עסקיות** (`User`, `Congregant`, `TenantConfig`) לבין **Roles**, שהם תוויות הרשאה של actor מאומת. `TenantConfig` הוא המודל הטכני של "הגדרות בית הכנסת".

- `admin` (מנהל מערכת) – ניהול משתמשים ותפקידים, הגדרות בית הכנסת, מודולים ואינטגרציות, אבטחה וגישה תפעולית לשעת חירום.
- `gabai` (גבאי) – גישה מלאה לעבודה השוטפת, ללא ניהול משתמשים וללא שינוי הגדרות בית כנסת/מערכת מוגנות.
- `congregant` (מתפלל) – גישת WhatsApp בלבד למידע ציבורי ולנתונים/פעולות של עצמו. אין צורך ב-`User` או בהרשמה: מספר טלפון מאומת נפתר ל-`Congregant` ול-`congregant_id`; קישור `User.congregant_id` נשמר לפורטל עתידי אפשרי.

| יכולת | `admin` | `gabai` | `congregant` |
|---|---|---|---|
| משתמשים ושיוך Roles | מלא | ללא גישה | ללא גישה |
| הגדרות בית הכנסת (`TenantConfig`) | קריאה ושינוי | קריאה בלבד לפי צורך תפעולי | ללא גישה |
| מודולים, אינטגרציות ואבטחה | מלא | שימוש בלבד | ללא גישה |
| מודולים תפעוליים | מלא | מלא | רק פעולות self-service מפורשות |
| דוחות וייבוא | מלא | מלא | ללא גישה |
| כלי LLM | כלים מנהליים ותפעוליים | כלים תפעוליים | כלים ציבוריים וכלי `my_*` בלבד |
| נתונים אישיים | כל הרשומות | כל הרשומות לצורך עבודה | `congregant_id` של עצמו בלבד |

### שלב 1 – אימות משתמשים מקומי: Backend
- [x] מודול `app/modules/auth/` לפי מבנה Registry הקיים
- [x] מודל `User`: שם משתמש ייחודי, password hash עם Argon2id, role, active ו-`congregant_id`
- [x] מודל `RefreshSession`: hash של refresh token, תפוגה, ביטול ו-token family
- [x] Bootstrap חד-פעמי למנהל הראשון; לאחר מכן יצירת משתמשים על ידי Admin בלבד
- [x] `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [x] Access JWT קצר-חיים + Refresh token מסתובב עם reuse detection וביטול ב-logout
- [x] הגדרות `JWT_SECRET`, issuer, audience, זמני תפוגה ו-cookie security ב-`app/core/config.py`
- [x] `get_current_user` ו-`require_admin` כ-FastAPI dependencies
- [x] Alembic baseline ומיגרציות מפורשות לפני מעבר למסד Production
- [x] `tests/test_auth.py` + התאמת fixtures קיימים ל-client מאומת

#### בדיקות קבלה – שלב 1
- [x] Bootstrap נסגר לאחר יצירת המשתמש הראשון ורישום נוסף דורש Admin
- [x] Refresh rotation, reuse detection ו-logout revocation נבדקו אוטומטית
- [x] Production startup דוחה JWT secret חלש ו-cookie לא מאובטח
- [x] `alembic upgrade head` מצליח על מסד SQLite ריק
- [x] כל בדיקות ה-Backend עוברות (`92 passed`)

### שלב 1.5 – הגנת APIs והרשאות Backend
- [x] הגנה על כל ה-Routers; השארת allowlist ציבורי מפורש בלבד
- [x] הוספת `gabai` ל-`UserRole` ו-dependency כללי `require_roles(...)`
- [x] הגבלת ניהול משתמשים ושיוך Roles ל-`admin`
- [x] הגבלת `PATCH /api/v1/config` ל-`admin`; `GET /api/v1/config` נשאר ציבורי לצורכי מיתוג pre-login בלבד
- [x] אכיפת הרשאות גם בשכבת Service/DB לפעולות רגישות, לרבות קריאות מכלי LLM ו-WhatsApp
- [x] בדיקות `401` למשתמש אנונימי ו-`403` למשתמש ללא הרשאה בכל Router

### מקומי: Frontend שלב 2 – אימות משתמשים
- [x] דף התחברות (Login page) בעברית RTL
- [x] `AuthContext` / `useAuth` + Protected Routes ו-redirect ל-`/login`
- [x] Access token בזיכרון; Refresh token ב-`HttpOnly Secure SameSite` cookie
- [x] Authorization header מרכזי ב-`api/client.ts`, כולל העלאות FormData/CSV
- [x] מנגנון refresh יחיד, retry פעם אחת בלבד וטיפול אחיד ב-401
- [x] כפתור התנתקות ופרטי משתמש ב-Sidebar
- [x] ניקוי TanStack Query cache בהתנתקות
- [x] תשתית Role ל-Routes, ניווט ופעולות: Admin ו-Gabai מקבלים את מסכי התפעול הקיימים; מסכי ניהול Admin יתווספו עם ה-APIs הייעודיים
- [x] אין להסתמך על הסתרת UI כאמצעי הרשאה; ה-Backend נשאר מקור האמת

### שלב 3 – Authorization, LLM Scope ו-Rate Limiting
- [x] מודל Scope בצד השרת: `role=admin`, `role=gabai`, או `role=congregant, congregant_id=X`
- [x] רשימת כלי LLM נפרדת לפי Scope
- [x] סינון `congregant_id` בשכבת Service/DB ולא רק ב-Prompt
- [x] בדיקות Role matrix: Admin בלבד מנהל משתמשים/הגדרות; Gabai מבצע פעולות שוטפות אך נדחה מהגדרות מוגנות
- [x] בדיקות המוכיחות שמתפלל אינו יכול לקרוא או לשנות נתונים של מתפלל אחר, גם באמצעות LLM
- [x] Rate limiting נפרד ל-login כושל, refresh ו-`/llm/chat`
- [x] תשובת `429` אחידה ללא חשיפת קיום שם משתמש

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
- [ ] Amazon ECR פרטי ל-Backend ול-Frontend
- [ ] AWS ECS Fargate עבור שירותי ה-Frontend וה-Backend
- [ ] Amazon RDS PostgreSQL ב-private subnets, ללא port ציבורי
- [ ] AWS Secrets Manager עבור JWT, DB credentials ו-LLM API key; אין `.env.production` אמיתי ב-Git
- [ ] Route 53 + ACM TLS + Application Load Balancer ו-trusted forwarded headers
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
- [x] לא נדרש ל-v3.0: AWS ECS Fargate נותן יחס עלות/תועלת טוב יותר למופע קטן
- [ ] בחינה מחדש ב-v4.0 עבור multi-tenancy, מספר replicas, autoscaling מורכב ו-High Availability
- [ ] אם יידרש: Helm chart, Deployments, Services, Ingress, Secrets, migration Job, HPA ו-PDB

### Definition of Done
- [ ] ללא JWT כל endpoint רגיש מחזיר `401`; משתמש ללא הרשאה מקבל `403`
- [ ] `admin`, `gabai` ו-`congregant` עוברים בדיקות קבלה חיוביות ושליליות לפי מטריצת ההרשאות
- [ ] רק Admin יכול לנהל משתמשים/Roles ולשנות `TenantConfig`, מודולים, אינטגרציות והגדרות אבטחה
- [ ] Gabai יכול להשלים תהליכים תפעוליים, דוחות וייבוא, אך מקבל `403` בפעולות Admin מוגנות
- [ ] logout מבטל refresh session ושימוש חוזר ב-refresh token מבטל את ה-token family
- [ ] Scope של מתפלל נאכף ב-Service/DB גם תחת Prompt Injection, ללא תלות ב-UI, ב-Prompt או בלוגיקת WhatsApp
- [ ] CORS, Rate Limit, Security Headers וכיבוי docs נבדקו אוטומטית
- [ ] Compose מקומי ו-Staging בענן עוברים smoke test מלא
- [ ] migration, backup ו-restore נוסו בהצלחה על עותק נתונים אמיתי
- [ ] Pipeline ירוק ו-Production deploy ניתן ל-rollback ללא איבוד נתונים

---

## 🔴 v3.1 – Installation & Onboarding · התקנה ו-Onboarding

> **עיקרון:** מוצר מקצועי חייב שתהליך ההתקנה יהיה מתועד, חוזר על עצמו וניתן לביצוע ע"י מנהל מערכת ללא ידע קוד.  
> **תלוי ב-v3.0:** Docker, PostgreSQL ומנגנון Auth חייבים להיות מוכנים.

### תיעוד ותשתית

- [ ] `docs/INSTALLATION.md` — מדריך התקנה מלא: דרישות מקדמיות, .env, Docker Compose, יצירת משתמש ראשון, בדיקת smoke
- [ ] `docs/UPGRADE.md` — תהליך שדרוג: גיבוי DB, משיכת גרסה חדשה, הרצת מיגרציות, אימות
- [ ] `docs/BACKUP_RESTORE.md` — גיבוי ידני ואוטומטי, בדיקת שחזור, off-site storage
- [ ] `.env.example` — כל משתנה עם הסבר בעברית, ערכי ברירת מחדל ו-placeholder לסודות
- [ ] `CHANGELOG.md` — קובץ שינויים קבוע; מתעדכן עם כל release; כולל הוראות מיגרציה

### Bootstrap ו-First Run

- [ ] פקודת Bootstrap CLI: `python -m app.cli bootstrap` — יוצרת את משתמש ה-admin הראשון באינטראקציה
- [ ] חלופה: First-Run Page — אם אין משתמש admin בDB, מפנה אוטומטית לאשף הגדרה ראשונית
- [ ] אשף First-Run (Frontend): שם בית כנסת → עיר → יצירת סיסמת admin → (אופציונלי) הזמנת גבאי → "התחל להשתמש"
- [ ] לאחר השלמת האשף: `TenantConfig.setup_completed = true`; Banner ה-Onboarding נעלם

### מדדי הצלחה

- [ ] מנהל טכני שאינו מפתח יכול להתקין מ-`git clone` עד login תוך פחות מ-30 דקות
- [ ] `docker compose up` מקומי עובר smoke test מלא (login, CRUD, refresh, logout)
- [ ] תהליך שדרוג ניתן לביצוע ללא downtime על DB קיים

---

## 🔴 v3.2 – Support Platform · פלטפורמת תמיכה

> **עיקרון:** לפני בית כנסת שני — צוות המוצר חייב כלי תמיכה שאינם מצריכים גישת SSH.  
> **תלוי ב-v3.0 ו-v3.1.**

### Module Catalog – קטלוג מודולים

> **עיקרון:** super_admin הוא המקום שבו מוגדר מה נכלל במוצר הבסיסי ומה הוא תוסף. הקטלוג הוא מקור האמת — לא `.env.example`.

- [ ] מודל `ModuleCatalog` ב-`app/core/` — רשומה לכל מודול קיים:
  - `slug` — מזהה ייחודי (e.g. `congregants`, `llm`, `bulletin`)
  - `display_name` — שם לתצוגה
  - `description` — תיאור קצר
  - `tier` — `base` / `addon` / `enterprise`
  - `enabled_by_default` — האם נכלל בהתקנת ברירת מחדל
  - `depends_on` — רשימת slugs של מודולים תלויים (e.g. `bulletin` תלוי ב-`prayer_schedule`)
- [ ] הקטלוג מאוכלס בקוד (לא ב-DB) — super_admin רואה אותו, אינו יוצר רשומות חדשות
- [ ] `GET /platform/modules` — מחזיר את כל המודולים עם tier ו-enabled_by_default
- [ ] `GET /platform/modules/default-set` — מחזיר את רשימת slugs שמהווים את "ההתקנה הסטנדרטית"
- [ ] בעת onboarding של בית כנסת חדש (v4.0): ה-default-set משמש כנקודת פתיחה לפני שמנהל הבית כנסת משנה

**הקטלוג הנוכחי (base tier — נכלל בכל התקנה):**
`congregants`, `payments`, `aliyot`, `seating`, `azkarot`, `smachot`, `calendar`, `auth`, `prayer_schedule`, `bulletin`

**addon tier — מוסף לפי בקשה/תשלום:**
`llm` (דורש מפתח API חיצוני), `whatsapp` (v3.5), `visual_bulletin` (v3.6)

**enterprise tier — v4.0 ומעלה:**
`multi_tenant`, `audit_log_extended`, `sso`

### Backend – תפקיד super_admin ופאנל תמיכה

- [ ] `super_admin` פעיל ב-`UserRole` (נוסף ב-v2.5); dependency `require_super_admin()`
- [ ] `GET /platform/tenants` — רשימת כל בתי הכנסת (TenantConfig): שם, גרסה, כניסה אחרונה, `setup_completed`
- [ ] `GET /platform/tenants/{id}/config` — קריאה מלאה של TenantConfig לבית כנסת ספציפי לצורכי תמיכה
- [ ] `PATCH /platform/tenants/{id}/config` — עדכון הגדרות לבית כנסת ספציפי (תמיכה מרחוק)
- [ ] `GET /platform/tenants/{id}/audit-log` — לוג פעולות admin: שינויי הגדרות, שינויי תפקידים, ייצוא נתונים
- [ ] `GET /platform/stats` — סטטיסטיקות: מספר בתי כנסת פעילים, שיחות LLM ב-24 שעות האחרונות, שגיאות
- [ ] Audit Log Model — רשומה לכל פעולה רגישה: actor, action, entity, old_value, new_value, timestamp

### Frontend – פאנל `/platform`

- [ ] נתיב `/platform` — נחסם ל-`super_admin` בלבד; לא מופיע בסייד-בר הרגיל
- [ ] **דף Tenants:** טבלה — שם בית כנסת, עיר, תאריך הצטרפות, כניסה אחרונה, סטטוס setup, גרסה
- [ ] **דף Tenant פרטי:** הגדרות TenantConfig, משתמשים, לוג פעולות, סטטיסטיקות LLM
- [ ] **לוח מחוון Platform:** כרטיסי סיכום — בתי כנסת פעילים, שיחות LLM היום, שגיאות פתוחות
- [ ] **Module Catalog דף:** טבלת כל המודולים — slug, tier, enabled_by_default, תלויות; אפשרות לשנות `enabled_by_default` לכל מודול
- [ ] **Changelog In-App:** רנדור `CHANGELOG.md` בפאנל התמיכה ובטאב עזרה ב-Settings

### In-App Notifications לאדמין

- [ ] התראת LLM — כאשר קריאת LLM נכשלת (API key שגוי, מגבלת quota), admin רואה banner אדום
- [ ] התראת גיבוי — אם לא בוצע export של הנתונים ביותר מ-30 יום, admin רואה תזכורת
- [ ] התראת גרסה — כאשר גרסה חדשה זמינה (webhook / polling), admin רואה notification

### In-App Feedback

- [ ] כפתור "דווח על בעיה" (בסייד-בר, נגיש לגבאים) — טופס פשוט: תיאור + screenshot אופציונלי
- [ ] שליחה ל-email / webhook חיצוני (Slack, Linear) — לא מצריך DB
- [ ] קישור "בקש פיצ'ר" לטפסי משוב חיצוניים

### מדדי הצלחה

- [ ] צוות המוצר יכול לאבחן ולפתור בעיית תצורה בבית כנסת מרוחק ללא SSH
- [ ] כל שינוי ב-TenantConfig מוקלט ב-audit log עם שם המשתמש, ה-timestamp והערך הישן
- [ ] Admin מקבל התראה תוך דקה מכשל LLM

---

## 🟡 v3.5 – WhatsApp Bot · בוט וואטסאפ קהילתי

> **תלוי ב-v3.0** – נדרש: JWT Auth + LLM Scope model.  
> המוצר משרת גם את המתפללים עצמם – ללא אפליקציה, ללא הרשמה.

> **הערות טכניות:**
> - ה-API הרשמי: **WhatsApp Business Platform (Meta Cloud API)** – חינמי עד 1,000 שיחות/חודש
> - לפיתוח ובדיקות: **Twilio WhatsApp Sandbox** – פועל מיידית
> - זיהוי מתפלל: אימות מספר הטלפון → התאמה ל-`Congregant.phone` → Scope שרת של `congregant_id`; אין צורך ב-`User` או בהרשמה

### תשתית WhatsApp – Backend
- [ ] `app/modules/whatsapp/` – `api.py`, `service.py`
- [ ] `GET /webhooks/whatsapp` (verify) + `POST /webhooks/whatsapp` (receive)
- [ ] אימות חתימת webhook ומספר שולח לפני התאמה ל-`Congregant.phone`
- [ ] חסימת מספר לא מזוהה ללא חשיפת מידע והעברת מקרים עמומים לטיפול גבאי
- [ ] שימוש ב-LLM Scope `role=congregant` (מ-v3.0)

### Congregant Agent – LLM
- [ ] כלים מוגבלים: `get_my_payments`, `get_my_aliyot`, `get_my_azkara_reminders`, `get_upcoming_events`, `get_parasha_info`
- [ ] קריאות ציבוריות וקריאות self-service בטוחות (למשל העדפת שפה/תזכורות) יכולות להתבצע מיד
- [ ] שינויים רגישים בפרטי זהות, כספים, אזכרות, מקומות או הרשאות יוצרים בקשה לאישור Gabai ואינם מתבצעים מיד
- [ ] הגנה מפני Prompt Injection (שאילתות/Services מסוננים לפי `congregant_id` בשרת)
- [ ] Audit log לזיהוי, כלי שנבחר, Scope, שינוי, בקשת אישור ותוצאתה

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
> **מבוסס על קטלוג המודולים מ-v3.2.** ה-`ModuleCatalog.tier` הופך לנקודת ייחוס של מה מורשה לכל רישיון.
- [ ] מודל `License` – תוכנית (Basic / Premium / Enterprise), תאריך תפוגה, מודולים מורשים
- [ ] `LicenseService` – אימות רישיון בעת הפעלה + בדיקת מודולים מורשים מול `ModuleCatalog`
- [ ] `POST /admin/licenses`
- [ ] חיבור בין tier מ-`ModuleCatalog` לבין תוכנית הרישיון: `base` = Basic+, `addon` = Premium+, `enterprise` = Enterprise בלבד

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
