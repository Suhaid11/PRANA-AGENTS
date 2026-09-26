import type { UserRole, Permission } from './types';

/**
 * PRANA Authoritative Permission Matrix
 * 
 * Matrix Definition:
 * PERMISSION                    MEDIC   CLINICIAN   HOSPITAL   READINESS   ADMIN
 * VIEW_CASE                     ✓       ✓           ✓          ✓           ✓
 * RECORD_VITAL                  ✓       ✗           ✗          ✗           ✓(sandbox)
 * RECORD_OBSERVATION            ✓       ✗           ✗          ✗           ✓(sandbox)
 * RECORD_INTERVENTION           ✓       ✗           ✗          ✗           ✓(sandbox)
 * CLINICIAN_REVIEW              ✗       ✓           ✗          ✗           ✗
 * REQUEST_DATA                  ✗       ✓           ✗          ✗           ✗
 * ESCALATE                      ✗       ✓           ✗          ✗           ✗
 * ACKNOWLEDGE_SIGNAL            ✗       ✓           ✗          ✗           ✗
 * HOSPITAL_PREALERT_ACK         ✗       ✗           ✓          ✗           ✓(sandbox)
 * BAY_READY                     ✗       ✗           ✓          ✗           ✓(sandbox)
 * READINESS_UPDATE              ✗       ✗           ✗          ✓           ✓(sandbox)
 * DEMO_ADMIN                    ✗       ✗           ✗          ✗           ✓
 */
export const ROLE_PERMISSIONS: Record<UserRole, Record<Permission, boolean>> = {
  FIELD_MEDIC: {
    VIEW_CASE: true,
    RECORD_VITAL: true,
    RECORD_OBSERVATION: true,
    RECORD_INTERVENTION: true,
    CLINICIAN_REVIEW: false,
    REQUEST_DATA: false,
    ESCALATE: false,
    ACKNOWLEDGE_SIGNAL: false,
    HOSPITAL_PREALERT_ACK: false,
    BAY_READY: false,
    READINESS_UPDATE: false,
    DEMO_ADMIN: false,
  },
  REMOTE_CLINICIAN: {
    VIEW_CASE: true,
    RECORD_VITAL: false,
    RECORD_OBSERVATION: false,
    RECORD_INTERVENTION: false,
    CLINICIAN_REVIEW: true,
    REQUEST_DATA: true,
    ESCALATE: true,
    ACKNOWLEDGE_SIGNAL: true,
    HOSPITAL_PREALERT_ACK: false,
    BAY_READY: false,
    READINESS_UPDATE: false,
    DEMO_ADMIN: false,
  },
  HOSPITAL_COMMAND: {
    VIEW_CASE: true,
    RECORD_VITAL: false,
    RECORD_OBSERVATION: false,
    RECORD_INTERVENTION: false,
    CLINICIAN_REVIEW: false,
    REQUEST_DATA: false,
    ESCALATE: false,
    ACKNOWLEDGE_SIGNAL: false,
    HOSPITAL_PREALERT_ACK: true,
    BAY_READY: true,
    READINESS_UPDATE: false,
    DEMO_ADMIN: false,
  },
  READINESS: {
    VIEW_CASE: true,
    RECORD_VITAL: false,
    RECORD_OBSERVATION: false,
    RECORD_INTERVENTION: false,
    CLINICIAN_REVIEW: false,
    REQUEST_DATA: false,
    ESCALATE: false,
    ACKNOWLEDGE_SIGNAL: false,
    HOSPITAL_PREALERT_ACK: false,
    BAY_READY: false,
    READINESS_UPDATE: true,
    DEMO_ADMIN: false,
  },
  PORTAL_ADMIN: {
    VIEW_CASE: true,
    RECORD_VITAL: true,
    RECORD_OBSERVATION: true,
    RECORD_INTERVENTION: true,
    CLINICIAN_REVIEW: false, // Per prompt: Administrative access does not grant clinical authority
    REQUEST_DATA: false,
    ESCALATE: false,
    ACKNOWLEDGE_SIGNAL: false,
    HOSPITAL_PREALERT_ACK: true,
    BAY_READY: true,
    READINESS_UPDATE: true,
    DEMO_ADMIN: true,
  },
};

export function hasPermission(role?: UserRole | null, permission?: Permission): boolean {
  if (!role || !permission) return false;
  return !!ROLE_PERMISSIONS[role]?.[permission];
}

export function getRoleBadgeMeta(role: UserRole): {
  label: string;
  shortCode: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  switch (role) {
    case 'FIELD_MEDIC':
      return {
        label: 'Field Medic',
        shortCode: 'MEDIC',
        bgClass: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        textClass: 'text-emerald-700 dark:text-emerald-300',
        borderClass: 'border-emerald-500/30',
      };
    case 'REMOTE_CLINICIAN':
      return {
        label: 'Remote Tele-Specialist',
        shortCode: 'SPECIALIST',
        bgClass: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        textClass: 'text-cyan-700 dark:text-cyan-300',
        borderClass: 'border-cyan-500/30',
      };
    case 'HOSPITAL_COMMAND':
      return {
        label: 'Hospital Command',
        shortCode: 'ED CHARGE',
        bgClass: 'bg-purple-500/10 dark:bg-purple-500/20',
        textClass: 'text-purple-700 dark:text-purple-300',
        borderClass: 'border-purple-500/30',
      };
    case 'READINESS':
      return {
        label: 'Medical Readiness',
        shortCode: 'READINESS',
        bgClass: 'bg-amber-500/10 dark:bg-amber-500/20',
        textClass: 'text-amber-700 dark:text-amber-300',
        borderClass: 'border-amber-500/30',
      };
    case 'PORTAL_ADMIN':
      return {
        label: 'Mission Portal Admin',
        shortCode: 'ADMIN',
        bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
        textClass: 'text-blue-700 dark:text-blue-300',
        borderClass: 'border-blue-500/30',
      };
  }
}
