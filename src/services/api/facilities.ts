import { apiClient } from './client';
import type { EmergencyCase } from '../../types/emergency';

export async function submitRecalculateFacilities(caseId: string): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/facility-matching/recalculate`, {
    method: 'POST',
  });
}

export async function submitHospitalPreAlert(caseId: string): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/hospital/pre-alert`, {
    method: 'POST',
  });
}

export async function submitHospitalAcknowledge(caseId: string, confirmedBy?: string): Promise<EmergencyCase> {
  const query = confirmedBy ? `?confirmed_by=${encodeURIComponent(confirmedBy)}` : '';
  return apiClient<EmergencyCase>(`/cases/${caseId}/hospital/acknowledge${query}`, {
    method: 'POST',
  });
}

export async function submitHospitalBayReady(
  caseId: string,
  assignedBay: string = 'Trauma Bay 1 (Red Zone)',
  confirmedBy?: string
): Promise<EmergencyCase> {
  const params = new URLSearchParams();
  params.set('assigned_bay', assignedBay);
  if (confirmedBy) params.set('confirmed_by', confirmedBy);
  return apiClient<EmergencyCase>(`/cases/${caseId}/hospital/bay-ready?${params.toString()}`, {
    method: 'POST',
  });
}
