export type UserRole =
  | 'FIELD_MEDIC'
  | 'REMOTE_CLINICIAN'
  | 'HOSPITAL_COMMAND'
  | 'READINESS'
  | 'PORTAL_ADMIN';

export type Permission =
  | 'VIEW_CASE'
  | 'RECORD_VITAL'
  | 'RECORD_OBSERVATION'
  | 'RECORD_INTERVENTION'
  | 'CLINICIAN_REVIEW'
  | 'REQUEST_DATA'
  | 'ESCALATE'
  | 'ACKNOWLEDGE_SIGNAL'
  | 'HOSPITAL_PREALERT_ACK'
  | 'BAY_READY'
  | 'READINESS_UPDATE'
  | 'DEMO_ADMIN';

export interface UserPrincipal {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserPrincipal;
}

export interface AuthState {
  user: UserPrincipal | null;
  token: string | null;
  isAuthenticated: boolean;
  isOfflineDemo: boolean;
  isLoading: boolean;
  error: string | null;
}
