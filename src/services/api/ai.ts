import { apiClient } from './client';
import type { AiDecisionSupport } from '../../types/emergency';

export interface DecisionSupportResponse {
  caseId: string;
  provider: string;
  providerAvailable: boolean;
  statusMessage: string;
  activeSignal: AiDecisionSupport | null;
  historicalSignals: AiDecisionSupport[];
  totalSignals: number;
}

export async function fetchDecisionSupport(caseId: string): Promise<DecisionSupportResponse> {
  return apiClient<DecisionSupportResponse>(`/cases/${caseId}/decision-support`);
}

export async function evaluateDecisionSupport(caseId: string, force = false): Promise<AiDecisionSupport> {
  return apiClient<AiDecisionSupport>(`/cases/${caseId}/decision-support/evaluate`, {
    method: 'POST',
    body: JSON.stringify({ force }),
  });
}

export async function fetchLatestAgentTask(caseId: string): Promise<import('../../types/emergency').AgentTask> {
  return apiClient<import('../../types/emergency').AgentTask>(`/cases/${caseId}/agent-task/latest`);
}

export async function triggerAgentTask(caseId: string, provider?: string): Promise<import('../../types/emergency').AgentTask> {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
  return apiClient<import('../../types/emergency').AgentTask>(`/cases/${caseId}/agent-task/run${query}`, {
    method: 'POST',
  });
}

export interface ProviderStatusResponse {
  provider: string;
  runtime: string;
  model: string;
  available: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  statusMessage: string;
  latencyMs: number;
}

export async function fetchProviderStatus(provider?: string): Promise<ProviderStatusResponse> {
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : '';
  return apiClient<ProviderStatusResponse>(`/ai/provider-status${query}`);
}


