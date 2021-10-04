import { Application } from 'express';
import { Logger } from 'winston';
import { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, DomainEventSubscriberService, WorkQueueService } from '@core-services/core-common';
import { Repositories } from './repository';
import { createJobs } from './job';
import { TemplateService } from './template';
import { Notification, Providers } from './types';
import { createSubscriptionRouter } from './router';

export * from './types';
export * from './repository';
export * from './model';
export * from './template';
export * from './events';
export * from './configuration';

interface NotificationMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  eventService: EventService;
  templateService: TemplateService;
  eventSubscriber: DomainEventSubscriberService;
  queueService: WorkQueueService<Notification>;
  providers: Providers;
}

export const applyNotificationMiddleware = (
  app: Application,
  {
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    eventService,
    subscriptionRepository,
    templateService,
    eventSubscriber,
    queueService,
    providers,
  }: NotificationMiddlewareProps
): Application => {
  createJobs({
    serviceId,
    logger,
    tokenProvider,
    configurationService,
    eventService,
    templateService,
    events: eventSubscriber.getItems(),
    queueService,
    subscriptionRepository,
    providers,
  });

  const routerProps = {
    logger,
    subscriptionRepository,
  };
  const subscriptionRouter = createSubscriptionRouter(routerProps);

  app.use('/subscription/v1', assertAuthenticatedHandler, subscriptionRouter);

  return app;
};
