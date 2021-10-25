import { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';
import { ServiceStatusApplication } from './types'

const ApplicationDefinition = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    metadata: { type: 'object'}
  }
}

interface ApplicationEvent {
  id: string,
  name: string,
  description: string,
}

export const HealthCheckStartedDefinition: DomainEventDefinition = {
  name: 'health-check-started',
  description: 'Signalled when healthcheck started for an event',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
    },
  },
}

export const HealthCheckStoppedDefinition: DomainEventDefinition = {
  name: 'health-check-stopped',
  description: 'Signalled when an application health check is stopped.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
    },
  },
}

export const HealthCheckHealthyDefinition: DomainEventDefinition = {
  name: 'health-check-healthy',
  description: 'Signalled when an application is determined to be healthy by the health check.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
    },
  },
}

export const HealthCheckUnhealthyDefinition: DomainEventDefinition = {
  name: 'health-check-unhealthy',
  description: 'Signalled when an application is determined to be unhealthy by the health check.',
  payloadSchema: {
    type: 'object',
    properties: {
      application: ApplicationDefinition,
      error: { type: 'string' }
    },
  },
}

const mapApplication = (Application: ServiceStatusApplication): ApplicationEvent => {
  return {
    id: Application._id,
    name: Application.name,
    description: Application.description
  }
}

export const applicationStatusToStarted = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'health-check-started',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application)
  },
});

export const applicationStatusToStopped = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'health-check-stopped',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application)
  },
});

export const applicationStatusToUnhealthy = (application: ServiceStatusApplication, error: string): DomainEvent => ({
  name: 'health-check-unhealthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application),
    error
  }
});

export const applicationStatusToHealthy = (application: ServiceStatusApplication): DomainEvent => ({
  name: 'health-check-healthy',
  timestamp: new Date(),
  tenantId: AdspId.parse(application.tenantId),
  payload: {
    application: mapApplication(application)
  }
});