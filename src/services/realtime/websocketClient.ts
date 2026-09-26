import type { RealtimeEventEnvelope, RealtimeSubscriptionOptions } from './types';
import { fetchCaseEvents } from '../api/events';

const BACKOFF_STEPS = [1000, 2000, 4000, 8000, 15000];
const MAX_SEEN_EVENTS = 300;

export class CaseRealtimeSubscription {
  private ws: WebSocket | null = null;
  private isDestroyed = false;
  private reconnectAttempt = 0;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private seenEventIds = new Set<string>();
  private lastKnownVersion = 0;
  private options: RealtimeSubscriptionOptions;

  constructor(options: RealtimeSubscriptionOptions) {
    this.options = options;
    this.connect();
  }

  public updateKnownVersion(ver: number) {
    if (ver > this.lastKnownVersion) {
      this.lastKnownVersion = ver;
    }
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.hostname for robustness, targeting port 8000 for backend
    const host = window.location.hostname || '127.0.0.1';
    let token = this.options.token;
    if (!token) {
      try {
        token = localStorage.getItem('prana_jwt_access_token') || undefined;
      } catch {
        // Ignore
      }
    }
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    return `${protocol}//${host}:8000/api/v1/ws/cases/${this.options.caseId}?${tokenParam}`;
  }

  private connect() {
    if (this.isDestroyed) return;

    try {
      const url = this.getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempt = 0;
        this.options.onStatusChange('LIVE');
        this.startHeartbeat();

        // Send initial auth message frame if token available
        let token = this.options.token;
        if (!token) {
          try {
            token = localStorage.getItem('prana_jwt_access_token') || undefined;
          } catch {
            // Ignore
          }
        }
        if (token && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'AUTH', token }));
        }

        // Perform catch-up reconciliation if we already had a known version
        if (this.lastKnownVersion > 0) {
          this.performCatchUp();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle system handshake / pong
          if (data.type === 'CONNECTED') {
            if (data.currentVersion && data.currentVersion > this.lastKnownVersion) {
              this.lastKnownVersion = data.currentVersion;
            }
            return;
          }

          if (data.type === 'PONG') {
            return;
          }

          // Handle real-time event envelope
          if (data.eventId && data.eventType) {
            const envelope = data as RealtimeEventEnvelope;

            // 1. Duplicate event protection
            if (this.seenEventIds.has(envelope.eventId)) {
              return;
            }
            this.seenEventIds.add(envelope.eventId);
            if (this.seenEventIds.size > MAX_SEEN_EVENTS) {
              const first = this.seenEventIds.values().next().value;
              if (first) this.seenEventIds.delete(first);
            }

            // 2. Out-of-order / Stale event protection
            if (envelope.version <= this.lastKnownVersion && this.lastKnownVersion > 0) {
              // Stale event received after higher version already processed
              return;
            }

            this.lastKnownVersion = envelope.version;
            this.options.onEvent(envelope);
          }
        } catch (e) {
          console.warn('[Realtime] Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = () => {
        // Handled in onclose
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        if (!this.isDestroyed) {
          this.options.onStatusChange('RECONNECTING');
          this.scheduleReconnect();
        }
      };
    } catch {
      this.options.onStatusChange('OFFLINE');
      this.scheduleReconnect();
    }
  }

  private async performCatchUp() {
    try {
      const missingEvents = await fetchCaseEvents(this.options.caseId, this.lastKnownVersion);
      if (missingEvents && missingEvents.length > 0) {
        // Sort ascending by version
        const sorted = [...missingEvents].sort((a: any, b: any) => (a.version || 0) - (b.version || 0));
        for (const evt of sorted) {
          if (!this.seenEventIds.has(evt.id)) {
            this.seenEventIds.add(evt.id);
            if (evt.version && evt.version > this.lastKnownVersion) {
              this.lastKnownVersion = evt.version;
            }
            // Notify catch-up listener
            if (this.options.onCatchUp) {
              this.options.onCatchUp([evt]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Realtime] Catch-up reconciliation failed:', err);
    }
  }

  private scheduleReconnect() {
    if (this.isDestroyed || this.reconnectTimer) return;

    const delay = BACKOFF_STEPS[Math.min(this.reconnectAttempt, BACKOFF_STEPS.length - 1)];
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  public destroy() {
    this.isDestroyed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.options.onStatusChange('OFFLINE');
  }
}
