import { Application } from 'express';
import * as fs from 'fs';
import { Logger } from 'winston';
import { DomainEventSubscriberService } from '@core-services/core-common';
import { createStreamRouter } from './router';
import { Namespace as IoNamespace } from 'socket.io';
import { TenantService } from '@abgov/adsp-service-sdk';

export * from './configuration';
export * from './types';
export * from './model';
export * from './roles';

interface PushMiddlewareProps {
  logger: Logger;
  eventService: DomainEventSubscriberService;
  tenantService: TenantService;
}

export const applyPushMiddleware = (
  app: Application,
  ios: IoNamespace[],
  props: PushMiddlewareProps
): Application => {
  const streamRouter = createStreamRouter(ios, props);
  app.use('/stream/v1', streamRouter);

  let swagger = null;
  app.use('/swagger/docs/v1', (req, res) => {
    if (swagger) {
      res.json(swagger);
    } else {
      fs.readFile(`${__dirname}/swagger.json`, 'utf8', (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          swagger = JSON.parse(data);
          res.json(swagger);
        }
      });
    }
  });

  return app;
};
