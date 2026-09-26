/**
 * PRANA Unified API Client
 * Manages HTTP communication with FastAPI backend, timeouts, and connectivity state.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const HEALTH_URL = (import.meta as any).env?.VITE_API_HEALTH_URL || 'http://127.0.0.1:8000/health';
const DEFAULT_TIMEOUT_MS = 4000;

export class ApiError extends Error {
  public status: number;
  public details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function checkBackendHealth(): Promise<{ online: boolean; version?: string; activeCases?: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const resp = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) return { online: false };
    const data = await resp.json();
    return {
      online: data.status === 'ok',
      version: data.version,
      activeCases: data.active_cases,
    };
  } catch {
    return { online: false };
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutMs = (options as any).timeoutMs || (options.body instanceof FormData ? 20000 : DEFAULT_TIMEOUT_MS);
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let token: string | null = null;
    try {
      token = localStorage.getItem('prana_jwt_access_token');
    } catch {
      // Ignore localStorage access failures
    }

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new ApiError(
        errorData.detail || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      console.warn(`[PRANA API] HTTP ${err.status} error from ${endpoint}:`, err.message);
      throw err;
    }
    if (err.name === 'AbortError') {
      console.warn(`[PRANA API] Request timeout (${timeoutMs}ms) to ${endpoint}`);
      throw new ApiError('PRANA backend request timed out.', 408);
    }
    const isNetworkDown = err.message === 'Failed to fetch' || err.name === 'TypeError';
    const message = isNetworkDown
      ? `PRANA backend service unreachable at ${url}. Please verify the FastAPI service is active.`
      : (err.message || 'Network error communicating with PRANA backend.');
    console.warn(`[PRANA API] Connection error to ${endpoint}:`, err);
    throw new ApiError(message, 503);
  }
}
