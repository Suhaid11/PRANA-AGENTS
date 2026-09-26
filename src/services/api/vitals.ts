import { apiClient } from './client';
import type { EmergencyCase, VitalSnapshot } from '../../types/emergency';

export async function submitVitalSnapshot(
  caseId: string,
  vitals: Omit<VitalSnapshot, 'timestamp'> & { timestamp?: string }
): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/vitals`, {
    method: 'POST',
    body: JSON.stringify(vitals),
  });
}

export async function fetchVitalsHistory(caseId: string): Promise<VitalSnapshot[]> {
  return apiClient<VitalSnapshot[]>(`/cases/${caseId}/vitals`);
}
