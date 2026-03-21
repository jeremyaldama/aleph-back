import { ServiceProvider } from '../agent.types';

export interface StartAgentDto {
  cycleIntervalMs?: number;
  requestPayload?: Record<string, unknown>;
  providers?: ServiceProvider[];
}
