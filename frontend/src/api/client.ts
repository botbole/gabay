const BASE_URL = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  const json = await res.json();
  return json.data ?? json;
}

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
    const res = await fetch(`${BASE_URL}/synagogue/congregants/bulk/csv`, { method: 'POST', body: form });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? 'Upload failed');
    }
    const json = await res.json();
    return { ...(json.data ?? {}), message: json.message };
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

  bulkImportSheets: async (url: string): Promise<BulkImportResult> => {
    const res = await fetch(`${BASE_URL}/synagogue/congregants/bulk/sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? 'Import failed');
    }
    const json = await res.json();
    return { ...(json.data ?? {}), message: json.message };
  },
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
  get: (id: string) => request<Place>(`/synagogue/places/${id}`),
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
  byParasha: (parasha: string) =>
    request<{ parasha: string; total: number; aliyot: Aliya[] }>(
      `/synagogue/aliyot/parasha/${parasha}`
    ),
  create: (body: AliyaCreate) =>
    request<Aliya>('/synagogue/aliyot', { method: 'POST', body: JSON.stringify(body) }),
  bulkDelete: (ids: string[]) => bulkDelete('/synagogue/aliyot', ids),
};

// ─── Azkarot & Smachot ───────────────────────────────────────────────────────

export interface Azkara {
  id: string;
  congregant_id: string;
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

export const eventsApi = {
  upcomingAzkarot: (days = 30) =>
    request<{ total: number; azkarot: Azkara[] }>(
      `/synagogue/azkarot/upcoming?days_ahead=${days}`
    ),
  upcomingSmachot: (days = 30) =>
    request<{ total: number; smachot: Simcha[] }>(
      `/synagogue/smachot/upcoming?days_ahead=${days}`
    ),
};

export const azkarotApi = {
  list: (congregant_id?: string) =>
    request<{ total: number; azkarot: Azkara[] }>(
      `/synagogue/azkarot${congregant_id ? `?congregant_id=${congregant_id}` : ''}`
    ),
  upcoming: (days = 30) =>
    request<{ total: number; azkarot: Azkara[] }>(
      `/synagogue/azkarot/upcoming?days_ahead=${days}`
    ),
  get: (id: string) => request<Azkara>(`/synagogue/azkarot/${id}`),
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
  get: (id: string) => request<Simcha>(`/synagogue/smachot/${id}`),
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
}

export const calendarApi = {
  gregorianToHebrew: (date: string) =>
    request<HebrewDateInfo>(`/synagogue/calendar/gregorian-to-hebrew?date=${date}`),
  monthView: (year: number, month: number) =>
    request<CalendarMonth>(`/synagogue/calendar/month-view?year=${year}&month=${month}`),
};
