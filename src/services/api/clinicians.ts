import { apiClient } from './client';
import type { EmergencyCase } from '../../types/emergency';

export interface ConfirmReviewPlanPayload {
  action?: 'CONFIRMED';
  clinicianId?: string;
  clinicianName?: string;
  reviewPlanTitle?: string;
  notes?: string;
  timestamp?: string;
}

export interface RequestDataPayload {
  requestedDataType: string;
  clinicianId?: string;
  clinicianName?: string;
  notes?: string;
  timestamp?: string;
}

export interface EscalateCasePayload {
  reason: string;
  clinicianId?: string;
  clinicianName?: string;
  notes?: string;
  timestamp?: string;
}

export interface AcknowledgeSignalPayload {
  signalId?: string;
  clinicianId?: string;
  clinicianName?: string;
  notes?: string;
  timestamp?: string;
}

export async function submitClinicianReview(caseId: string, payload: ConfirmReviewPlanPayload): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/clinician-review`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'CONFIRMED',
      ...payload,
    }),
  });
}

export async function submitDataRequest(caseId: string, payload: RequestDataPayload): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/data-request`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'DATA_REQUESTED',
      ...payload,
    }),
  });
}

export async function submitEscalation(caseId: string, payload: EscalateCasePayload): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/escalation`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'ESCALATED',
      ...payload,
    }),
  });
}

export async function submitAcknowledgement(caseId: string, payload: AcknowledgeSignalPayload): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/${caseId}/acknowledgement`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'ACKNOWLEDGED',
      ...payload,
    }),
  });
}
