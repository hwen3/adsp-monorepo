export interface Webhook {
  id: string;
  url: string;
  name: string;
  targetId: string;
  intervalMinutes: number;
  events: { id: string }[];
  description: string;
  generatedByTest?: boolean;
}

export interface EventCriteria {
  correlationId?: string;
  context?: Record<string, boolean | number | string>;
}

export interface StreamEvent {
  namespace: string;
  name: string;
  map?: Record<string, string>;
  criteria?: EventCriteria;
}

export interface Stream {
  id: string;
  name: string;
  description: string;
  eventTypes: StreamEvent[];
  subscriberRoles: string[];
  publicSubscribe: boolean;
  webhook: Webhook;
}
