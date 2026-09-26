export type RealtimeStatus = 'LIVE' | 'RECONNECTING' | 'OFFLINE';

export interface RealtimeActor {
  type: string;
  id?: string;
  name?: string;
}

export interface RealtimeEventEnvelope {
  eventId: string;
  caseId: string;
  eventType: string;
  version: number;
  timestamp: string;
  actor: RealtimeActor;
  payload: Record<string, any>;
}

export interface RealtimeSubscriptionOptions {
  caseId: string;
  clientId?: string;
  role?: string;
  token?: string;
  onEvent: (event: RealtimeEventEnvelope) => void;
  onStatusChange: (status: RealtimeStatus) => void;
  onCatchUp?: (events: any[]) => void;
}
