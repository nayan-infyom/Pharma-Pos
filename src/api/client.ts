/**
 * Thin fetch wrapper — the single place that knows the backend's response
 * envelope, auth header, and refresh-on-401 handling. Every src/api/*.ts
 * resource file goes through this; nothing outside src/api/ ever calls
 * fetch() directly (per the approved Phase K adapter strategy).
 *
 * Access token lives in memory only (never localStorage — see Phase D). The
 * refresh token is an httpOnly cookie the browser sends automatically
 * (credentials: 'include'); this module never sees its value.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  pagination?: Pagination;
  error?: { code: string; message: string; details?: unknown };
}

let accessToken: string | null = null;
/** Set by useAppStore once a session exists; read here without importing the store (avoids a circular import). */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}
export function getAccessToken(): string | null {
  return accessToken;
}

/** Invoked on an unrecoverable auth failure (refresh also failed) so the app can drop back to the login screen. */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

// Concurrent 401s must all await the SAME refresh attempt, not fire one each.
let refreshPromise: Promise<boolean> | null = null;

async function attemptRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (!res.ok) return false;
        const body = (await res.json()) as Envelope<{ accessToken: string }>;
        if (body?.data?.accessToken) {
          setAccessToken(body.data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Internal — prevents infinite retry loops on the refresh call itself. */
  _isRetry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Returns the full envelope (data + pagination if present) — callers below extract what they need. */
async function request<T>(path: string, options: RequestOptions = {}): Promise<Envelope<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  let body: Envelope<T>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('INTERNAL_ERROR', 'The server returned an unexpected response.', res.status);
  }

  if (res.status === 401 && !options._isRetry && path !== '/auth/refresh') {
    const refreshed = await attemptRefresh();
    if (refreshed) return request<T>(path, { ...options, _isRetry: true });
    setAccessToken(null);
    onSessionExpired?.();
  }

  if (!body.success) {
    throw new ApiError(body.error?.code ?? 'INTERNAL_ERROR', body.error?.message ?? 'Something went wrong.', res.status, body.error?.details);
  }

  return body;
}

export async function apiGet<T>(path: string, query?: RequestOptions['query']): Promise<T> {
  const { data } = await request<T>(path, { method: 'GET', query });
  return data as T;
}
export async function apiGetPaginated<T>(path: string, query?: RequestOptions['query']): Promise<{ items: T[]; pagination: Pagination }> {
  const { data, pagination } = await request<T[]>(path, { method: 'GET', query });
  return { items: (data as T[]) ?? [], pagination: pagination as Pagination };
}
export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await request<T>(path, { method: 'POST', body });
  return data as T;
}
export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await request<T>(path, { method: 'PATCH', body });
  return data as T;
}
export async function apiDelete<T>(path: string): Promise<T> {
  const { data } = await request<T>(path, { method: 'DELETE' });
  return data as T;
}
