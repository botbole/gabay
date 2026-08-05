const BASE_URL = '/api/v1';

export type UserRole = 'admin' | 'gabai' | 'congregant';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  congregant_id: string | null;
  created_at: string;
}

export interface AuthSession {
  access_token: string;
  expires_in: number;
  user: AuthUser;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type SessionListener = (session: AuthSession | null) => void;

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession> | null = null;
let sessionListener: SessionListener | null = null;

export function setAuthSessionListener(listener: SessionListener | null) {
  sessionListener = listener;
}

function updateSession(session: AuthSession | null) {
  accessToken = session?.access_token ?? null;
  sessionListener?.(session);
}

async function parseResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.message ?? json?.detail ?? res.statusText ?? 'Request failed';
    throw new ApiError(message, res.status);
  }
  const data = json?.data ?? json;
  if (
    json?.message
    && data
    && typeof data === 'object'
    && !Array.isArray(data)
    && !('message' in data)
  ) {
    return { ...data, message: json.message } as T;
  }
  return data as T;
}

async function performFetch<T>(
  path: string,
  options?: RequestInit,
  includeAccessToken = true,
): Promise<T> {
  const headers = new Headers(options?.headers);
  const isFormData = options?.body instanceof FormData;

  if (options?.body != null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (includeAccessToken && accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  return parseResponse<T>(res);
}

function refreshAccessToken(): Promise<AuthSession> {
  if (!refreshPromise) {
    refreshPromise = performFetch<AuthSession>(
      '/auth/refresh',
      { method: 'POST' },
      false,
    )
      .then(session => {
        updateSession(session);
        return session;
      })
      .catch(error => {
        updateSession(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function request<T>(
  path: string,
  options?: RequestInit,
  allowRefresh = true,
): Promise<T> {
  try {
    return await performFetch<T>(path, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
    if (!allowRefresh) {
      updateSession(null);
      throw error;
    }

    try {
      await refreshAccessToken();
    } catch {
      throw error;
    }
    return request<T>(path, options, false);
  }
}

export const authApi = {
  login: async (username: string, password: string) => {
    const session = await performFetch<AuthSession>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      false,
    );
    updateSession(session);
    return session;
  },
  refresh: () => refreshAccessToken(),
  logout: async () => {
    try {
      await performFetch<void>('/auth/logout', { method: 'POST' }, false);
    } finally {
      updateSession(null);
    }
  },
};

// ─── Congregants ────────────────────────────────────────────────────────────

// ─── Shared helpers ──────────────────────────────────────────────────────────

function bulkDelete(path: string, ids: string[]) {
  return request<{ deleted: number }>(`${path}/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export interface Congregant {
  id: string;
  first_name: string;
  last_name: string;
  hebrew_name: string;
  father_name: string;
  mother_name: string;
  phone: string;
  email: string;
  address: string;
  is_kohen: boolean;
  is_levi: boolean;
  member_type: string;
  notes: string;
  join_date: string;
  gender: string;
  is_archived: boolean;
  archived_at: string;
}

export interface CongregantCreate {
  first_name: string;
  last_name: string;
  hebrew_name?: string;
  father_name?: string;
  mother_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_kohen?: boolean;
  is_levi?: boolean;
  member_type?: string;
  notes?: string;
  join_date?: string;
  // Extra fields that auto-create linked Azkara / Simcha records
  azkara_father?: string;               // Gregorian date YYYY-MM-DD (converted to DD/MM/YYYY before send)
  azkara_father_hebrew_day?: number;
  azkara_father_hebrew_month?: number;
  azkara_mother?: string;
  azkara_mother_hebrew_day?: number;
  azkara_mother_hebrew_month?: number;
  birth_date?: string;
  birth_date_hebrew_day?: number;
  birth_date_hebrew_month?: number;
  bar_mitzvah_shabbat?: string;         // Free-text parasha / Shabbat name
  gender?: string;                      // 'male' | 'female'
}

export interface BulkImportResult {
  created: number;
  skipped: { row: number; reason: string }[];
  errors: { row: number; name: string; error: string }[];
  records: Congregant[];
  message?: string;
}

export const congregantsApi = {
  list: (member_type?: string, archived = false) => {
    const params = new URLSearchParams();
    if (member_type) params.set('member_type', member_type);
    if (archived) params.set('archived', 'true');
    const qs = params.toString();
    return request<{ total: number; congregants: Congregant[] }>(
      `/synagogue/congregants${qs ? `?${qs}` : ''}`
    );
  },
  get: (id: string) =>
    request<Congregant>(`/synagogue/congregants/${id}`),
  create: (body: CongregantCreate) =>
    request<Congregant>('/synagogue/congregants', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<CongregantCreate>) =>
    request<Congregant>(`/synagogue/congregants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  getPlace: (id: string) =>
    request<Place>(`/synagogue/congregants/${id}/place`),

  bulkImportCsv: async (file: File): Promise<BulkImportResult> => {
    const form = new FormData();
    form.append('file', file);
    return request<BulkImportResult>('/synagogue/congregants/bulk/csv', {
      method: 'POST',
      body: form,
    });
  },

  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/congregants', ids),
  bulkArchive: (ids: string[]) =>
    request<{ archived: number }>('/synagogue/congregants/bulk-archive', {
      method: 'POST', body: JSON.stringify({ ids }),
    }),
  bulkRestore: (ids: string[]) =>
    request<{ restored: number }>('/synagogue/congregants/bulk-restore', {
      method: 'POST', body: JSON.stringify({ ids }),
    }),

  bulkImportSheets: (url: string) =>
    request<BulkImportResult>('/synagogue/congregants/bulk/sheets', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
};

// ─── Payments ───────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  congregant_id: string;
  amount: number;
  purpose: string;
  currency: string;
  notes: string;
  date: string;
}

export interface PaymentCreate {
  congregant_id: string;
  amount: number;
  purpose: string;
  currency?: string;
  notes?: string;
  payment_date?: string;
}

export const paymentsApi = {
  list: (purpose?: string) =>
    request<{ total_records: number; total_amount: number; payments: Payment[] }>(
      `/synagogue/payments${purpose ? `?purpose=${purpose}` : ''}`
    ),
  pending: () =>
    request<{ total_pending: number; congregants: { id: string; name: string }[] }>(
      '/synagogue/payments/pending'
    ),
  history: (congregant_id: string) =>
    request<{ congregant_id: string; total_paid: number; by_purpose: Record<string, number>; payments: Payment[] }>(
      `/synagogue/payments/${congregant_id}/history`
    ),
  create: (body: PaymentCreate) =>
    request<Payment>('/synagogue/payments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/payments', ids),
};

// ─── Places / Seating ────────────────────────────────────────────────────────

export interface Place {
  id: string;
  section: string;
  row: string;
  place_number: number;
  congregant_id: string | null;
  is_reserved: boolean;
  annual_fee: number;
  notes: string;
}

export interface PlaceCreate {
  section: string;
  row: string;
  place_number: number;
  congregant_id?: string;
  is_reserved?: boolean;
  annual_fee?: number;
  notes?: string;
}

export const seatingApi = {
  list: (section?: string, only_free?: boolean) => {
    const params = new URLSearchParams();
    if (section) params.set('section', section);
    if (only_free) params.set('only_free', 'true');
    const qs = params.toString();
    return request<{ total: number; places: Place[] }>(
      `/synagogue/places${qs ? `?${qs}` : ''}`
    );
  },
  create: (body: PlaceCreate) =>
    request<Place>('/synagogue/places', { method: 'POST', body: JSON.stringify(body) }),
  assign: (id: string, congregant_id: string, annual_fee?: number) =>
    request<Place>(`/synagogue/places/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ congregant_id, is_reserved: true, annual_fee: annual_fee ?? 0 }),
    }),
  unassign: (id: string) =>
    request<Place>(`/synagogue/places/${id}/unassign`, { method: 'PATCH' }),
  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/places', ids),
};

// ─── LLM / Chat ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  actions?: { tool: string; args: Record<string, unknown>; result: unknown }[];
}

export const llmApi = {
  chat: (message: string, history?: ChatMessage[]) =>
    request<ChatResponse>('/llm/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};

// ─── Aliyot ─────────────────────────────────────────────────────────────────

export interface Aliya {
  id: string;
  congregant_id: string;
  parasha: string;
  aliya_type: string;
  date: string;
  minhag: string;
  donation_amount: number;
  notes: string;
}

export interface AliyaCreate {
  congregant_id: string;
  parasha: string;
  aliya_type: string;
  date_str?: string;
  minhag?: string;
  donation_amount?: number;
  notes?: string;
}

export const aliyotApi = {
  list: () =>
    request<{ total: number; aliyot: Aliya[] }>('/synagogue/aliyot'),
  history: (congregant_id: string) =>
    request<{ congregant_id: string; total_aliyot: number; aliyot: Aliya[] }>(
      `/synagogue/aliyot/${congregant_id}/history`
    ),
  create: (body: AliyaCreate) =>
    request<Aliya>('/synagogue/aliyot', { method: 'POST', body: JSON.stringify(body) }),
  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/aliyot', ids),
};

// ─── Azkarot & Smachot ───────────────────────────────────────────────────────

export interface Azkara {
  id: string;
  congregant_id: string;
  congregant_name?: string;
  deceased_name: string;
  deceased_hebrew_name: string;
  relation: string;
  gregorian_date: string;
  hebrew_day: number;
  hebrew_month: number;
  year_occurred?: number | null;
  notes: string;
  next_gregorian?: string;
}

export interface AzkaraCreate {
  congregant_id: string;
  deceased_name: string;
  deceased_hebrew_name?: string;
  relation?: string;
  gregorian_date?: string;
  hebrew_day?: number;
  hebrew_month?: number;
  year_occurred?: number;
  notes?: string;
}

export interface Simcha {
  id: string;
  congregant_id: string;
  congregant_name?: string;
  occasion_type: string;
  description: string;
  gregorian_date: string;
  hebrew_day: number;
  hebrew_month: number;
  parasha: string;
  year_occurred?: number | null;
  notes: string;
  next_gregorian?: string;
}

export interface SimchaCreate {
  congregant_id: string;
  occasion_type: string;
  description?: string;
  gregorian_date?: string;
  hebrew_day?: number;
  hebrew_month?: number;
  parasha?: string;
  year_occurred?: number;
  notes?: string;
}


export const azkarotApi = {
  list: (congregant_id?: string) =>
    request<{ total: number; azkarot: Azkara[] }>(
      `/synagogue/azkarot${congregant_id ? `?congregant_id=${congregant_id}` : ''}`
    ),
  upcoming: (days = 30) =>
    request<{ total: number; azkarot: Azkara[] }>(
      `/synagogue/azkarot/upcoming?days_ahead=${days}`
    ),
  create: (body: AzkaraCreate) =>
    request<Azkara>('/synagogue/azkarot', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<{ id: string }>(`/synagogue/azkarot/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/azkarot', ids),
};

export const smachotApi = {
  list: (congregant_id?: string, occasion_type?: string) => {
    const params = new URLSearchParams();
    if (congregant_id) params.set('congregant_id', congregant_id);
    if (occasion_type) params.set('occasion_type', occasion_type);
    const qs = params.toString();
    return request<{ total: number; smachot: Simcha[] }>(
      `/synagogue/smachot${qs ? `?${qs}` : ''}`
    );
  },
  upcoming: (days = 30, occasion_type?: string) =>
    request<{ total: number; smachot: Simcha[] }>(
      `/synagogue/smachot/upcoming?days_ahead=${days}${occasion_type ? `&occasion_type=${occasion_type}` : ''}`
    ),
  create: (body: SimchaCreate) =>
    request<Simcha>('/synagogue/smachot', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<{ id: string }>(`/synagogue/smachot/${id}`, { method: 'DELETE' }),
  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/smachot', ids),
};

// ─── Calendar ────────────────────────────────────────────────────────────────

export interface CalendarDay {
  hebrew_day: number;
  hebrew_month: number;
  hebrew_year: number;
  hebrew_day_str: string;
  gregorian_date: string;
  day_of_week: number;
  grid_col: number;
  is_shabbat: boolean;
  holiday_en: string | null;
  holiday_he: string | null;
  is_rosh_chodesh: boolean;
  parasha_he: string | null;
  azkarot: Azkara[];
  smachot: Simcha[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  month_name_hebrew: string;
  month_name_english: string;
  is_leap_year: boolean;
  num_days: number;
  hebrew_year_str: string;
  prev_month: { year: number; month: number };
  next_month: { year: number; month: number };
  days: CalendarDay[];
}

export interface HebrewDateInfo {
  year: number;
  month: number;
  day: number;
  month_name_hebrew: string;
  month_name_english: string;
  formatted_hebrew: string;
  formatted_english: string;
  gregorian: string;
  holiday_he: string | null;
  holiday_en: string | null;
}

export interface DayTimes {
  gregorian_date: string;
  city: string;
  alot_hashachar: string | null;
  sunrise: string | null;
  chatzot: string | null;
  mincha_gedola: string | null;
  plag_hamincha: string | null;
  sunset: string | null;
  tzeit_hakochavim: string | null;
  candle_lighting: string | null;
  havdalah: string | null;
  parasha_he: string | null;
}

export const calendarApi = {
  gregorianToHebrew: (date: string) =>
    request<HebrewDateInfo>(`/synagogue/calendar/gregorian-to-hebrew?date=${date}`),
  monthView: (year: number, month: number) =>
    request<CalendarMonth>(`/synagogue/calendar/month-view?year=${year}&month=${month}`),
  dayTimes: (date: string) =>
    request<DayTimes>(`/synagogue/calendar/day-times?date=${date}`),
};

// ─── Prayer Schedule ─────────────────────────────────────────────────────────

export interface PrayerRule {
  id: string;
  name: string;
  day_type: string;
  anchor: string;
  offset_minutes: number;
  exact_time: string | null;
  free_text: string | null;
  no_auto_time: boolean;
  is_lesson: boolean;
  day_of_week: number | null;         // legacy, superseded by days_of_week
  days_of_week: string | null;        // comma-sep ints: "0,1,5" = Sun,Mon,Fri; null = every day
  notes: string;
  display_order: number;
  is_active: boolean;
}

export interface PrayerRuleCreate {
  name: string;
  day_type: string;
  anchor: string;
  offset_minutes?: number;
  exact_time?: string | null;
  free_text?: string | null;
  no_auto_time?: boolean;
  is_lesson?: boolean;
  days_of_week?: number[] | null;     // [0,1,5] = Sun,Mon,Fri; null = every day
  notes?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface PrayerRuleUpdate {
  name?: string;
  anchor?: string;
  offset_minutes?: number;
  exact_time?: string | null;
  free_text?: string | null;
  no_auto_time?: boolean;
  is_lesson?: boolean;
  days_of_week?: number[] | null;     // null clears the selection → every day
  notes?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface CalculatedPrayer extends PrayerRule {
  calculated_time: string | null;
  offset_label: string;
}

export interface DaySchedule {
  date: string;
  day_type: string;
  hebrew_date: string;
  city: string;
  zmanim: Record<string, string | null>;
  prayers: CalculatedPrayer[];
}

export interface SpecialDay {
  id: string;
  name: string;
  hebrew_month: number;
  hebrew_day: number;
  notes: string;
}

export interface SpecialDayCreate {
  name: string;
  hebrew_month: number;
  hebrew_day: number;
  notes?: string;
}

export const scheduleApi = {
  getRules: (day_type?: string) => {
    const qs = day_type ? `?day_type=${day_type}` : '';
    return request<{ rules: PrayerRule[]; total: number }>(`/synagogue/prayer-rules${qs}`);
  },
  createRule: (body: PrayerRuleCreate) =>
    request<PrayerRule>('/synagogue/prayer-rules', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateRule: (id: string, body: PrayerRuleUpdate) =>
    request<PrayerRule>(`/synagogue/prayer-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteRule: (id: string) =>
    request<{ deleted: string }>(`/synagogue/prayer-rules/${id}`, { method: 'DELETE' }),
  reorderRules: (day_type: string, ordered_ids: string[]) =>
    request<{ reordered: number }>('/synagogue/prayer-rules/reorder', {
      method: 'POST',
      body: JSON.stringify({ day_type, ordered_ids }),
    }),
  getSchedule: (date: string) =>
    request<DaySchedule>(`/synagogue/schedule?date=${date}`),
  getWeekSchedule: (from_date: string) =>
    request<{ from: string; days: DaySchedule[] }>(`/synagogue/schedule/week?from_date=${from_date}`),
  generateWeekly: (week_start?: string) => {
    const qs = week_start ? `?week_start=${week_start}` : '';
    return request<{ text: string; week_start: string; shabbat_date: string }>(
      `/synagogue/schedule/generate${qs}`
    );
  },
  getSpecialDays: () =>
    request<{ days: SpecialDay[]; total: number }>('/synagogue/special-days'),
  createSpecialDay: (body: SpecialDayCreate) =>
    request<SpecialDay>('/synagogue/special-days', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteSpecialDay: (id: string) =>
    request<{ deleted: string }>(`/synagogue/special-days/${id}`, { method: 'DELETE' }),
};

// ─── Tenant Config ───────────────────────────────────────────────────────────

export interface ModuleManifestItem {
  module_id: string;
  display_name: string;
  icon: string;
  nav_path: string;
}

export interface TenantConfig {
  id: number;
  synagogue_name: string;
  logo_url: string;
  color_primary: string;
  color_secondary: string;
  color_bg: string;
  enabled_modules: string;
  enabled_modules_list: string[];
  modules_manifest: ModuleManifestItem[];
}

export const configApi = {
  get: () => request<TenantConfig>('/config'),
};
