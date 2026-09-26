import { apiClient } from './client';
import type { PrehospitalHandoverPackage } from '../../types/emergency';

export interface HandoverVerifyResult {
  match: boolean;
  packageId: string;
  storedHash: string;
  recalculatedHash: string;
  verifiedAt: string;
  details: string;
}

export interface HandoverSummary {
  packageId: string;
  caseId: string;
  caseVersion: number;
  status: string;
  generatedAt: string;
  generatedByName: string;
  completenessStatus: string;
  integrityHash: string;
}

/**
 * Generate a new authoritative Prehospital Handover Package snapshot from current case state.
 */
export async function generateHandover(caseId: string): Promise<PrehospitalHandoverPackage> {
  return apiClient<PrehospitalHandoverPackage>(`/cases/${caseId}/handover/generate`, {
    method: 'POST'
  });
}

/**
 * Retrieve the latest Prehospital Handover Package for an emergency case.
 */
export async function getLatestHandover(caseId: string): Promise<PrehospitalHandoverPackage> {
  return apiClient<PrehospitalHandoverPackage>(`/cases/${caseId}/handover`, {
    method: 'GET'
  });
}

/**
 * Retrieve a specific version of a Prehospital Handover Package by ID.
 */
export async function getHandoverById(caseId: string, packageId: string): Promise<PrehospitalHandoverPackage> {
  return apiClient<PrehospitalHandoverPackage>(`/cases/${caseId}/handover/${packageId}`, {
    method: 'GET'
  });
}

/**
 * List all historical handover versions for an emergency case.
 */
export async function listHandoverVersions(caseId: string): Promise<HandoverSummary[]> {
  return apiClient<HandoverSummary[]>(`/cases/${caseId}/handover/list`, {
    method: 'GET'
  });
}

/**
 * Acknowledge receipt of a Prehospital Handover Package by Receiving Hospital Command.
 */
export async function acknowledgeHandover(
  caseId: string,
  packageId: string,
  notes?: string
): Promise<PrehospitalHandoverPackage> {
  return apiClient<PrehospitalHandoverPackage>(`/cases/${caseId}/handover/${packageId}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ notes })
  });
}

/**
 * Independently verify SHA-256 cryptographic digest of a Prehospital Handover Package.
 */
export async function verifyHandoverIntegrity(
  caseId: string,
  packageId: string
): Promise<HandoverVerifyResult> {
  return apiClient<HandoverVerifyResult>(`/cases/${caseId}/handover/${packageId}/verify`, {
    method: 'GET'
  });
}

/**
 * Export Prehospital Handover Package as JSON or FHIR R4 Bundle blob for download.
 */
export async function downloadHandoverExport(
  caseId: string,
  packageId: string,
  format: 'json' | 'fhir' = 'json'
): Promise<void> {
  const token = localStorage.getItem('prana_jwt_access_token');
  const response = await fetch(`/api/v1/cases/${caseId}/handover/${packageId}/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  if (!response.ok) {
    throw new Error(`Failed to export handover document: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = format === 'fhir' 
    ? `PRANA_Handover_${caseId}_${packageId}_FHIR_R4.json`
    : `PRANA_Handover_${caseId}_${packageId}.json`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
