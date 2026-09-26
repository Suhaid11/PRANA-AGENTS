import { apiClient } from './client';
import type { TimelineEvent } from '../../types/emergency';

export async function fetchCaseEvents(caseId: string, afterVersion?: number): Promise<TimelineEvent[]> {
  const query = afterVersion !== undefined ? `?after_version=${afterVersion}` : '';
  return apiClient<TimelineEvent[]>(`/cases/${caseId}/events${query}`);
}

export async function submitCaseEvent(
  caseId: string,
  event: Omit<TimelineEvent, 'id' | 'timestamp'> & { timestamp?: string; payload?: dict }
): Promise<TimelineEvent> {
  return apiClient<TimelineEvent>(`/cases/${caseId}/events`, {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

type dict = Record<string, any>;
