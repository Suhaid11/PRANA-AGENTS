import { apiClient } from './client';
import type { CaseDraft, EmergencyCase } from '../../types/emergency';

export interface CaseDraftConfirmOptions {
  assignedHospital?: string;
  ambulanceCallSign?: string;
  crewLead?: string;
  domain?: string;
}

export async function submitVoiceIntake(
  audioBlob: Blob,
  clientTranscript?: string,
  language: string = 'en'
): Promise<CaseDraft> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  if (clientTranscript) {
    formData.append('clientTranscript', clientTranscript);
  }
  formData.append('language', language);

  return apiClient<CaseDraft>('/cases/intake/voice', {
    method: 'POST',
    body: formData,
    timeoutMs: 60000,
  } as any);
}

export async function submitTextIntake(
  text: string,
  sourceName: string = 'Field Medic Notes'
): Promise<CaseDraft> {
  return apiClient<CaseDraft>('/cases/intake/text', {
    method: 'POST',
    body: JSON.stringify({ text, sourceName }),
    timeoutMs: 60000,
  } as any);
}

export async function submitFileIntake(file: File): Promise<CaseDraft> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return apiClient<CaseDraft>('/cases/intake/file', {
    method: 'POST',
    body: formData,
    timeoutMs: 60000,
  } as any);
}

export async function getCaseDraft(draftId: string): Promise<CaseDraft> {
  return apiClient<CaseDraft>(`/cases/intake/${draftId}`, {
    method: 'GET',
  });
}

export async function updateDraftField(
  draftId: string,
  fieldName: string,
  newValue: any,
  unit?: string,
  resolveAmbiguity: boolean = false
): Promise<CaseDraft> {
  return apiClient<CaseDraft>(`/cases/intake/${draftId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fieldName,
      newValue,
      unit,
      resolveAmbiguity,
    }),
  });
}

export async function confirmCaseDraft(
  draftId: string,
  options?: CaseDraftConfirmOptions
): Promise<EmergencyCase> {
  return apiClient<EmergencyCase>(`/cases/intake/${draftId}/confirm`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
    timeoutMs: 30000,
  } as any);
}
