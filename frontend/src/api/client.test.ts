import { afterEach, describe, expect, it, vi } from 'vitest';

const session = (token: string) => ({
  access_token: token,
  expires_in: 900,
  user: {
    id: 'user-1',
    username: 'admin',
    role: 'admin' as const,
    is_active: true,
    congregant_id: null,
    created_at: '2026-08-04T00:00:00Z',
  },
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('authenticated API client', () => {
  it('keeps the access token in memory and adds it to API requests', async () => {
    const accessToken = crypto.randomUUID();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, data: session(accessToken) }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: { total: 0, congregants: [] },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const { authApi, congregantsApi } = await import('./client');
    await authApi.login('admin', 'password');
    await congregantsApi.list();

    const [, requestInit] = fetchMock.mock.calls[1];
    const headers = new Headers(requestInit?.headers);
    expect(headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
    expect(requestInit?.credentials).toBe('include');
  });

  it('uses the authenticated pipeline for FormData without setting Content-Type', async () => {
    const accessToken = crypto.randomUUID();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, data: session(accessToken) }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        message: 'Imported',
        data: { created: 1, skipped: [], errors: [], records: [] },
      }));
    vi.stubGlobal('fetch', fetchMock);

    const { authApi, congregantsApi } = await import('./client');
    await authApi.login('admin', 'password');
    const result = await congregantsApi.bulkImportCsv(new File(['name'], 'people.csv'));

    const [, requestInit] = fetchMock.mock.calls[1];
    const headers = new Headers(requestInit?.headers);
    expect(requestInit?.body).toBeInstanceOf(FormData);
    expect(headers.get('Content-Type')).toBeNull();
    expect(headers.get('Authorization')).toBe(`Bearer ${accessToken}`);
    expect(result.message).toBe('Imported');
  });

  it('shares one refresh across concurrent 401 responses and retries once', async () => {
    const expiredToken = crypto.randomUUID();
    const freshToken = crypto.randomUUID();
    let refreshCalls = 0;
    let resourceCalls = 0;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return jsonResponse({ success: true, data: session(expiredToken) });
        }
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return jsonResponse({ success: true, data: session(freshToken) });
        }

        resourceCalls += 1;
        const headers = new Headers(init?.headers);
        if (headers.get('Authorization') === `Bearer ${expiredToken}`) {
          return jsonResponse({ detail: 'Authentication required' }, 401);
        }
        return jsonResponse({
          success: true,
          data: { total: 0, congregants: [] },
        });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const { authApi, congregantsApi } = await import('./client');
    await authApi.login('admin', 'password');
    await Promise.all([congregantsApi.list(), congregantsApi.list()]);

    expect(refreshCalls).toBe(1);
    expect(resourceCalls).toBe(4);
  });

  it('does not refresh or retry again after the retried request returns 401', async () => {
    const expiredToken = crypto.randomUUID();
    const freshToken = crypto.randomUUID();
    let refreshCalls = 0;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith('/auth/login')) {
          return jsonResponse({ success: true, data: session(expiredToken) });
        }
        if (url.endsWith('/auth/refresh')) {
          refreshCalls += 1;
          return jsonResponse({ success: true, data: session(freshToken) });
        }
        return jsonResponse({ detail: 'Authentication required' }, 401);
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const { authApi, congregantsApi, ApiError } = await import('./client');
    await authApi.login('admin', 'password');

    await expect(congregantsApi.list()).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(1);
  });
});
