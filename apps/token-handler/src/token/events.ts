import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { AuthenticationClient } from './model';

export const ClientRegisteredEventDefinition: DomainEventDefinition = {
  name: 'client-registered',
  description: 'Signalled when a token handler client is registered.',
  payloadSchema: {
    type: 'object',
    properties: {
      client: {
        id: { type: 'string' },
        clientId: { type: 'string' },
        authCallbackUrl: { type: 'string' },
      },
      registeredBy: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },
};

export function clientRegistered(client: AuthenticationClient, user: User): DomainEvent {
  return {
    name: ClientRegisteredEventDefinition.name,
    timestamp: new Date(),
    context: {},
    tenantId: client.tenantId,
    payload: {
      client: {
        id: client.id,
        clientId: client.credentials.clientId,
        authCallbackUrl: client.authCallbackUrl,
      },
      registeredBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}
