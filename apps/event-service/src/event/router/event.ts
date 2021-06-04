import { assertAuthenticatedHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { NamespaceEntity } from '../model';
import { AdspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';

interface EventRouterProps {
  logger: Logger;
}

export const createEventRouter = ({ logger }: EventRouterProps): Router => {
  const eventRouter = Router();

  eventRouter.post('/events', assertAuthenticatedHandler, async (req, res, next) => {
    const user = req.user;
    const { tenantId, namespace, name, timestamp: timeValue } = req.body;

    const tenant = tenantId ? AdspId.parse(tenantId as string) : user.tenantId;
    if (tenant && !user.isCore) {
      throw new UnauthorizedUserError('send tenant event.', user);
    }

    if (!timeValue) {
      next(new InvalidOperationError('Event must include a timestamp representing the time when the event occurred.'));
    }
    const timestamp = new Date(timeValue);

    const configuration = (await req.getConfiguration<Record<string, NamespaceEntity>, Record<string, NamespaceEntity>>(
      tenant
    )) || {
      options: null,
    };

    const namespaces: Record<string, NamespaceEntity> = {
      ...configuration,
      ...(configuration.options || {}),
      options: undefined,
    };

    if (!namespaces[namespace] || !namespaces[namespace].definitions[name]) {
      next(new NotFoundError('Event Definition', `${namespace}:${name}`));
    }

    const entity = namespaces[namespace];
    const definition = entity.definitions[name];
    if (!definition) {
      next(new NotFoundError('Event Definition', `${namespace}:${name}`));
    }

    try {
      definition.send(user, { ...req.body, timestamp, tenantId: tenant });

      res.sendStatus(200);
      logger.debug(`Event ${namespace}:${name} sent by user ${user.name} (ID: ${user.id}).`);
    } catch (err) {
      next(err);
    }
  });

  return eventRouter;
};
