import type { AdspId, ConfigurationService, TokenProvider } from '@abgov/adsp-service-sdk';
import type { DomainEvent } from '@core-services/core-common';
import axios from 'axios';
import type { Logger } from 'winston';
import { NamespaceEntity } from '../model';

interface LogEventJobProps {
  serviceId: AdspId;
  logger: Logger;
  valueServiceUrl: URL;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
}

async function calculateIntervalMetric(
  serviceId: AdspId,
  logger: Logger,
  tokenProvider: TokenProvider,
  configurationService: ConfigurationService,
  logUrl: URL,
  { timestamp, correlationId, tenantId, context: contextValue, namespace, name }: DomainEvent,
  metrics: Record<string, number>
) {
  // Try to calculate durations on a best effort basis.
  try {
    // If there is a correlation ID, try to find the associated event definition.
    let token = await tokenProvider.getAccessToken();
    const [configuration, options] = await configurationService.getConfiguration<
      Record<string, NamespaceEntity>,
      Record<string, NamespaceEntity>
    >(serviceId, token, tenantId);

    const namespaces: Record<string, NamespaceEntity> = {
      ...(configuration || {}),
      ...(options || {}),
    };

    // Get the interval configuration of the event definition.
    const interval = namespaces?.[namespace]?.definitions?.[name]?.interval;
    if (interval) {
      logger.debug(`Computing interval metric for event ${namespace}:${name} (correlation ID: ${correlationId})...`, {
        context: 'EventLog',
        tenantId: tenantId.toString(),
      });

      const { namespace: intervalNamespace, name: intervalName, metric: metricValue } = interval;
      const metricNameElements = Array.isArray(metricValue) ? metricValue : [metricValue];

      const eventContext = contextValue || {};
      const context = {
        namespace: intervalNamespace,
        name: intervalName,
      };

      // Read the start of the interval from the event log.
      token = await tokenProvider.getAccessToken();
      const { data } = await axios.get<Record<string, Record<string, { timestamp: string }[]>>>(
        logUrl.href + `?top=1&tenantId=${tenantId}&correlationId=${correlationId}&context=${JSON.stringify(context)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const value = data?.['event-service']?.['event']?.[0];

      // Calculate the duration from the current event timestamp to the start event timestamp.
      if (value?.timestamp) {
        const intervalStart = new Date(value.timestamp);
        const intervalDuration = Math.round((timestamp.getTime() - intervalStart.getTime()) / 1000);
        metrics[`${metricNameElements.map((m) => eventContext[m] || m).join(':')}:duration`] = intervalDuration;

        logger.debug(
          `Computed interval metric for event ${intervalNamespace}:${intervalName} to ` +
            `${namespace}:${name} (correlation ID: ${correlationId}): ${intervalDuration} seconds`,
          {
            context: 'EventLog',
            tenantId: tenantId.toString(),
          }
        );
      }
    }
  } catch (err) {
    logger.warn(
      `Error encountered computing duration for event ${namespace}:${name} (correlation ID: ${correlationId}) interval. ${err}`,
      {
        context: 'EventLog',
        tenantId: tenantId.toString(),
      }
    );
  }
}

export const createLogEventJob =
  ({ logger, serviceId, valueServiceUrl, tokenProvider, configurationService }: LogEventJobProps) =>
  async (event: DomainEvent, done: (err?: unknown) => void): Promise<void> => {
    const logUrl = new URL('v1/event-service/values/event', valueServiceUrl);
    const { timestamp, correlationId, tenantId, context, namespace, name, payload } = event;

    logger.debug(`Writing event to log (${namespace}:${name})...`, { context: 'EventLog', tenantId });

    const { namespace: vNamespace, name: vName } = context || {};
    // Skip logging of event value written events for the event log itself; otherwise it would be in a loop.
    if (
      namespace === 'value-service' &&
      name === 'value-written' &&
      vNamespace === 'event-service' &&
      vName === 'event'
    ) {
      logger.debug('Skipping logging for event log written event.');
      done();
      return;
    }

    const valueWrite = {
      timestamp,
      correlationId,
      tenantId: `${tenantId}`,
      context: {
        ...(context || {}),
        namespace,
        name,
      },
      value: { payload },
      metrics: {
        [`total:count`]: 1,
        [`${namespace}:${name}:count`]: 1,
      },
    };

    if (correlationId) {
      await calculateIntervalMetric(
        serviceId,
        logger,
        tokenProvider,
        configurationService,
        logUrl,
        event,
        valueWrite.metrics
      );
    }

    try {
      const token = await tokenProvider.getAccessToken();
      await axios.post(logUrl.href, valueWrite, { headers: { Authorization: `Bearer ${token}` } });

      logger.info(`Wrote event '${event.namespace}:${event.name}' to log.`, {
        context: 'EventLog',
        tenantId: tenantId.toString(),
      });
      done();
    } catch (err) {
      logger.error(`Error encountered trying to log event ${namespace}:${name}. ${err}`, {
        context: 'EventLog',
        tenantId: tenantId.toString(),
      });
      done(err);
    }
  };
