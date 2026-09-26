import { apiClient } from './client';
import type { EmergencyCase } from '../../types/emergency';

export async function fetchCase(caseId: string): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}`);
}

export async function fetchAllCases(): Promise<EmergencyCase[]> {
  return apiClient<EmergencyCase[]>('/cases');
}

export async function resetBackendCase(caseId: string): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/reset`, {
    method: 'POST',
  });
}

export async function submitTrafficDelay(caseId: string, trafficDelayMinutes: number): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/traffic`, {
    method: 'POST',
    body: JSON.stringify({ trafficDelayMinutes }),
  });
}
