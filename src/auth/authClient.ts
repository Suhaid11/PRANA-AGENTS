import type { UserPrincipal, AuthResponse, UserRole } from './types';
import { apiClient } from '../services/api/client';

/**
 * Storage key for PRANA Session JWT.
 * 
 * SECURITY ARCHITECTURE NOTE (Prototype vs Production):
 * In this high-density prototype, localStorage is utilized for convenient multi-role tab
 * synchronization and fast browser persona switching.
 * LIMITATION: localStorage is accessible to JavaScript and vulnerable to XSS.
 * PRODUCTION ROADMAP: Production deployment requires HttpOnly, SameSite=Strict, Secure cookies,
 * or short-lived memory tokens with partitioned refresh rotation, MFA, and OAuth2/OIDC SSO.
 */
const TOKEN_STORAGE_KEY = 'prana_jwt_access_token';
const USER_STORAGE_KEY = 'prana_user_principal';

export const DEMO_PERSONAS: Array<{
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  description: string;
}> = [
  {
    id: 'usr-medic-102',
    username: 'medic@demo.prana',
    displayName: 'Paramedic Rajesh Kumar',
    role: 'FIELD_MEDIC',
    description: 'Ambulance Echo-4 lead. Records vitals, observations, interventions.',
  },
  {
    id: 'usr-clinician-482',
    username: 'clinician@demo.prana',
    displayName: 'Dr. Sunita Rao, MD',
    role: 'REMOTE_CLINICIAN',
    description: 'Senior Trauma & Critical Care Specialist. Endorses protocol plans.',
  },
  {
    id: 'usr-hospital-704',
    username: 'hospital@demo.prana',
    displayName: 'Sister Philomina, RN',
    role: 'HOSPITAL_COMMAND',
    description: 'Receiving ED Charge Nurse. Manages sterile resuscitation bays.',
  },
  {
    id: 'usr-readiness-301',
    username: 'readiness@demo.prana',
    displayName: 'Officer Anil Deshmukh',
    role: 'READINESS',
    description: 'Regional Resource & Inventory Officer.',
  },
  {
    id: 'usr-admin-001',
    username: 'admin@demo.prana',
    displayName: 'Director Vikram Sharma',
    role: 'PORTAL_ADMIN',
    description: 'Emergency Coordination Mission Director.',
  },
];

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.warn('[PRANA Auth] Failed to save token to localStorage:', e);
  }
}

export function getStoredUser(): UserPrincipal | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: UserPrincipal): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('[PRANA Auth] Failed to save user to localStorage:', e);
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (e) {
    console.warn('[PRANA Auth] Failed to clear auth from localStorage:', e);
  }
}

export async function loginWithCredentials(username: string, password: string): Promise<AuthResponse> {
  const resp = await apiClient<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  const token = resp.accessToken || resp.access_token;
  const user: UserPrincipal = {
    id: resp.user.id,
    username: resp.user.username,
    email: resp.user.email,
    displayName: resp.user.displayName || resp.user.display_name,
    role: resp.user.role as UserRole,
    isActive: resp.user.isActive ?? resp.user.is_active ?? true,
  };

  setStoredToken(token);
  setStoredUser(user);

  return {
    accessToken: token,
    tokenType: resp.tokenType || resp.token_type || 'bearer',
    user,
  };
}

export async function fetchAuthenticatedPrincipal(token: string): Promise<UserPrincipal> {
  const raw = await apiClient<any>('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return {
    id: raw.id,
    username: raw.username,
    email: raw.email,
    displayName: raw.displayName || raw.display_name,
    role: raw.role as UserRole,
    isActive: raw.isActive ?? raw.is_active ?? true,
  };
}

export async function logoutActiveSession(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await apiClient('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // Ignore network errors on logout
    }
  }
  clearStoredAuth();
}
