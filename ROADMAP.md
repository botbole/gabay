# ROADMAP – גבאי

מסמך זה מפרק את הפיתוח לאבני דרך. הצ'קבוקסים משקפים את המצב בפועל בקוד.

---

## Milestone 1 – MVP · ייבוא נתונים וניהול מתפללים בסיסי

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

## Milestone 2 – Core Features · לוח שנה מחובר ו-LLM פעיל

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

## Infrastructure – Testing

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

## Milestone 2.5 – Advanced Gabay · כספים, תקשורת ובינה מלאכותית מתקדמת

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
- [ ] בחירת קטעים להכלרה/הסרה לפי שבוע (ללא שמחות, ללא שיעורים וכו')

### שדרוג הגבאי הדיגיטלי (LLM 2.0)
- [ ] Knowledge Base (RAG) – תמיכה בשאלות על בסיס מסמכי PDF (תקנון, נהלים, הלכות)
- [ ] שאילתות מורכבות (למשל: "מי לא עלה לתורה בחצי שנה האחרונה?")
- [ ] שילוב זמני הלכה (זמני היום) בתוך תשובות הצ'אט

---

## Milestone 2.6 – Synagogue Schedule · לוח זמנים חכם לבית הכנסת

יעד: מודול ניהול זמני תפילות ושיעורים המבוסס על **כללים** ולא על שעות קבועות. הזמנים מחושבים אוטומטית ביחס לאירועי השמיים (שקיעה, הנץ, כניסת שבת) כך שהלוח תמיד מדויק לכל שבוע ושבוע.

> **רעיון המפתח:** במקום להגיד "מנחה ב-17:30", הגבאי מגדיר "מנחה = 15 דקות לפני שקיעה". המערכת מחשבת את השעה המדויקת לכל יום אוטומטית.

### מנוע הכללים (Rules Engine) – Backend
- [ ] מודל `PrayerRule` – כלל תפילה עם שדות:
  - `name` (שם: שחרית, מנחה, ערבית, שיעור דף יומי...)
  - `day_type` (סוג יום: חול / שבת / יום טוב / ראש חודש)
  - `anchor` (עוגן: `sunrise` / `sunset` / `candle_lighting` / `havdalah` / `chatzot` / `fixed`)
  - `offset_minutes` (הפרש מהעוגן: מספר שלם, שלילי = לפני, חיובי = אחרי)
  - `fixed_time` (שעה קבועה אם `anchor = fixed`, למשל "08:00")
  - `is_active` (האם הכלל פעיל)
- [ ] `prayer_service.calculate_times(date)` – מחשב את כל זמני התפילות ליום נתון לפי הכללים + זמני ה-zmanim
- [ ] endpoint `GET /synagogue/schedule?date=YYYY-MM-DD` – מחזיר לוח תפילות מחושב ליום
- [ ] endpoint `GET /synagogue/schedule/week?from=YYYY-MM-DD` – לוח שבועי מלא
- [ ] CRUD endpoints לניהול כללים (`GET/POST/PATCH/DELETE /synagogue/prayer-rules`)

### ממשק ניהול – Frontend
- [ ] טאב "זמני בית הכנסת" בממשק הגבאי
- [ ] עורך כללים: הוספה/עריכה/מחיקה של כלל עם בחירת עוגן מתוך רשימה
- [ ] תצוגת לוח מחושב ליום ולשבוע – עם שעות בפועל לצד הכלל
- [ ] הפרדה בין ימי חול / שבת / יום טוב
- [ ] שיעורים ולימוד: אותה מערכת כללים לשיעורים קבועים (דף יומי, פרשת שבוע וכו')

### אינטגרציה עם מודולים אחרים
- [ ] שילוב לוח הזמנים בלוח השבועי (Bulletin) – הזמנים מחושבים מהכללים
- [ ] כלי LLM `get_prayer_times(date)` – הגבאי הדיגיטלי יכול לענות "מתי מנחה היום?"
- [ ] תצוגת זמנים ב-Dashboard (כרטיס "זמני היום")

## Milestone 2.7 – Financials & Reports · ניהול פיננסי ודוחות

יעד: מתן תמונה כלכלית מלאה לוועד בית הכנסת – מעבר לתרומות בלבד, תוך הפקת דוחות מסודרים.

### Backend
- [ ] מודל `Expense` – הוצאה (תאריך, סכום, קטגוריה, תיאור, קישור לחשבונית)
- [ ] מודל `Income` – הכנסה שאינה תרומה (השכרת אולם, מכירת ספרים, מענקים...)
- [ ] CRUD endpoints להוצאות (`GET/POST/PATCH/DELETE /synagogue/expenses`)
- [ ] CRUD endpoints להכנסות שאינן תרומות (`GET/POST/PATCH/DELETE /synagogue/income`)
- [ ] endpoint דוח שנתי: `GET /synagogue/reports/annual?year=` – מחזיר P&L מסכם (הכנסות, הוצאות, עודף/גירעון)
- [ ] endpoint ייצוא ל-CSV / PDF

### Frontend
- [ ] טאב "ניהול כלכלי" בדף תשלומים (או דף עצמאי)
  - לשונית "הוצאות" – טבלת רשומות + הוספה/עריכה/מחיקה
  - לשונית "הכנסות אחרות" – אותו מבנה
  - לשונית "דוח שנתי" – תצוגת P&L עם גרף עוגה/עמודות
- [ ] כפתור "ייצא ל-PDF" לדוח השנתי

---

## Milestone 2.8 – Smart Aliyot & Inventory · שיבוץ חכם ומלאי

יעד: שיבוץ עליות לתורה חכם ומסייע, ומעקב בסיסי אחרי נכסי בית הכנסת.

### שיבוץ עליות חכם (Smart Aliya Engine)
- [ ] אלגוריתם הצעה: מבוסס תדירות עליות, קרבת יארצייט/שמחה, סטטוס כהן/לוי/ישראל
- [ ] כלי LLM חדש `suggest_aliyot(parasha, date)` – מציע רשימת שיוכים לפרשה נתונה
- [ ] ווידג'ט "הצעות שיבוץ לשבת הקרובה" ב-Dashboard (מבוסס ה-LLM)
- [ ] עמוד עליות: כפתור "הצע שיבוץ אוטומטי" לצד הוספה ידנית

### ניהול מלאי (Inventory)
- [ ] מודל `InventoryItem` – פריט (שם, כמות, קטגוריה: ספרים/ציוד/כלי קודש, הערות)
- [ ] CRUD endpoints (`GET/POST/PATCH/DELETE /synagogue/inventory`)
- [ ] דף "מלאי" בסייד-בר עם טבלה + הוספה/עריכה

---

## Milestone 3 – Production · אבטחה ואימות משתמשים

יעד: המערכת מוכנה לפריסה בסביבת ייצור עם הגנה על הנתונים.

### אימות משתמשים – Backend
- [ ] מודל `User` במסד הנתונים (שם משתמש, סיסמה מוצפנת עם bcrypt)
- [ ] endpoint הרשמה / יצירת משתמש ראשוני (`POST /auth/register`)
- [ ] endpoint התחברות עם החזרת JWT (`POST /auth/login`)
- [ ] middleware לאימות JWT על כל ה-endpoints של `/api/v1/synagogue` ו-`/api/v1/llm`
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
- [ ] בדיקת `.env` לא נכנס ל-git (`.gitignore`)

### גיבוי ונתונים
- [ ] endpoint ייצוא מתפללים ל-CSV (`GET /synagogue/congregants/export/csv`)
- [ ] תיעוד נוהל גיבוי ידני של קובץ `gabay.db`
- [ ] migration script למעבר מ-SQLite ל-PostgreSQL בייצור

### פריסה (Deployment)
- [ ] `Dockerfile` לשרת ה-Backend
- [ ] `Dockerfile` לבנייה ו-serve של ה-Frontend (nginx)
- [ ] `docker-compose.yml` לסביבה מלאה (backend + frontend + db)
- [ ] הגדרת משתני סביבה לייצור (`.env.production`)
- [ ] תיעוד פריסה ב-`docs/DEPLOYMENT.md`

---

## Milestone 3.5 – WhatsApp Bot · בוט וואטסאפ קהילתי

יעד: הפיכת המערכת למוצר שמשרת גם את המתפללים עצמם – ללא אפליקציה, ללא הרשמה. המתפלל שולח הודעה למספר וואטסאפ של בית הכנסת ומקבל מענה אישי חכם. הגבאי יכול לשלוח עדכונים ותזכורות לכלל הקהילה.

> **הערות טכניות:**
> - ה-API הרשמי: **WhatsApp Business Platform (Meta Cloud API)** – חינמי עד 1,000 שיחות שירות/חודש
> - לפיתוח ובדיקות: **Twilio WhatsApp Sandbox** – פועל מיידית ללא אישור מטא
> - הודעות יוצאות (Outbound): דורשות **Template Message** מאושרת מראש על-ידי מטא (אישור תוך 1–3 ימים)
> - זיהוי מתפלל: לפי `Congregant.phone` – אין צורך בהרשמה, סיסמה, או JWT

### תשתית WhatsApp – Backend
- [ ] משתני סביבה חדשים: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`
- [ ] `app/api/v1/whatsapp.py` עם שני endpoints:
  - `GET /webhooks/whatsapp` – אימות webhook ראשוני (נדרש על-ידי מטא)
  - `POST /webhooks/whatsapp` – קבלת הודעות נכנסות מהמתפלל
- [ ] `app/services/whatsapp_service.py` – שליחה וקבלה דרך Meta Cloud API / Twilio
- [ ] זיהוי מתפלל: התאמת מספר טלפון נכנס ל-`Congregant.phone`; אם לא נמצא – תשובה אוטומטית לפנות לגבאי

### Congregant Agent – LLM
- [ ] פרומפט מערכת מוגבל: עונה למתפלל על הנתונים שלו בלבד
- [ ] סט כלים מצומצם לסוכן (מסוננים לפי `congregant_id` בשרת, לא ב-prompt):
  - `get_my_payments` – סטטוס תשלומים אישי
  - `get_my_aliyot` – היסטוריית עליות אישית
  - `get_my_azkara_reminders` – אזכרות משפחתיות
  - `get_upcoming_events` – אירועי קהילה ציבוריים (שבת, חגים, שמחות)
  - `get_parasha_info` – פרשת השבוע וזמני תפילה
- [ ] הגנה מפני Prompt Injection: tool handlers ב-FastAPI מסננים תמיד ב-SQL לפי `congregant_id` – ה-LLM לא יכול לקבל נתונים של אחרים גם אם יתבקש

### הודעות יוצאות (Outbound / Broadcast)
- [ ] Template Messages מאושרות מטא לתזכורות אזכרה (D-7 ו-D-1)
- [ ] `POST /webhooks/broadcast` – endpoint לגבאי לשליחת עדכון לכלל המתפללים (או לרשימה)
- [ ] כפתור "שלח תזכורת בוואטסאפ" ממסך האזכרות בממשק הגבאי

---

## Milestone 4 – Platform & Customization · ארכיטקטורת פלטפורמה

יעד: הפיכת Gabay ממערכת סגורה לפלטפורמה גמישה שניתן להתאים לכל בית כנסת – עם יכולת להדליק/לכבות מודולים ולהזריק לוגיקה מותאמת אישית מבלי לגעת ב-Core.

> **רעיון המפתח:** כל בית כנסת מקבל "מניפסט" שמגדיר אילו מודולים פעילים ומהי הזהות הויזואלית שלו. הגבאי מתאים את עצמו אוטומטית.

### Module Registry – Backend
- [ ] `app/core/registry.py` – רישום דינמי של ראוטרים ושירותים לפי מודולים
- [ ] `ENABLED_MODULES` ב-`.env` (לדוגמה: `payments,aliyot,seating,whatsapp`)
- [ ] `main.py` רושם רק ראוטרים של מודולים פעילים
- [ ] תיעוד: כל מודול חדש מגדיר רישום עצמי (`module_meta.py`) עם שם, ראוטר ותלויות

### Hook System (Event Bus) – Backend
- [ ] `app/core/hooks.py` – מנגנון `register(event, handler)` + `fire(event, **kwargs)` אסינכרוני
- [ ] אירועי Core מוגדרים:
  - `congregant.created`, `congregant.archived`
  - `payment.recorded`
  - `aliya.assigned`
  - `azkara.approaching` (D-7, D-1)
  - `bulletin.building` (לפני יצירת הלוח השבועי)
- [ ] כל מודול (ובמיוחד מודולי קסטומיזציה) יכול להירשם לאירועים בזמן הפעלה

### Tenant Configuration – Backend
- [ ] מודל `TenantConfig` – הגדרות בית הכנסת (שם, לוגו URL, צבע ראשי, צבע משני, שם הרב, כתובת)
- [ ] endpoint `GET /config` – מחזיר את ה-Manifest לפרונטנד (מודולים פעילים + עיצוב)
- [ ] endpoint `PATCH /config` – עדכון הגדרות (זמין לגבאי ראשי בלבד)

### Dynamic Theme & Modules – Frontend
- [ ] `AppConfig` context – נטען ב-init מ-`GET /config`, מכיל מודולים פעילים + צבעים
- [ ] `Sidebar` מרנדר פריטי ניווט רק למודולים שב-`AppConfig.modules`
- [ ] CSS variables (`--color-indigo`, `--color-gold`) נקבעות דינמית מה-Manifest בזמן ריצה
- [ ] לוגו בית הכנסת ב-Sidebar נטען מה-`AppConfig.logo_url`

### Multi-tenancy Foundation (הכנה לענן)
- [ ] הוספת שדה `tenant_id` לכל המודלים (Congregant, Payment, Aliya, ...)
- [ ] Middleware שמזריק `tenant_id` לכל שאילתת DB לפי JWT / subdomain
- [ ] תיעוד ארכיטקטורת tenant: DB-per-tenant (SQLite) לעומת shared DB עם isolation

---

## Milestone 5 – Quality Assurance & UI Automation · הבטחת איכות ואוטומציה

יעד: הבטחת יציבות הממשק וחווית המשתמש (UX) לפני הפצה רחבה, תוך שימוש בבדיקות דפדפן אוטומטיות.

### תשתית E2E
- [ ] הקמת תשתית Playwright בתיקיית ה-Frontend
- [ ] כתיבת Smoke Tests למסלולים קריטיים (Login -> Dashboard)
- [ ] בדיקת תהליכי ליבה מקצה לקצה:
  - יצירת מתפלל ובדיקה שהוא מופיע בטבלה
  - רישום תשלום ווידוא עדכון היתרה בדאשבורד
  - הפקת דוח שנתי ובדיקת הורדת הקובץ
- [ ] בדיקת רספונסיביות: וודוא שהממשק שמיש במובייל וטאבלט
- [ ] בדיקת נגישות (Accessibility) בסיסית לאלמנטים המרכזיים
