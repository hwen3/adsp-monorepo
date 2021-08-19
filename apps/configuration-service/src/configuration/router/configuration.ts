import { AdspId, EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, InvalidOperationError, NotFoundError, Results } from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { configurationUpdated, revisionCreated } from '../events';
import { ConfigurationEntity } from '../model';
import { ConfigurationRepository, Repositories } from '../repository';
import { ConfigurationDefinition, ConfigurationDefinitions, ConfigurationRevision } from '../types';
import { OPERATION_DELETE, OPERATION_REPLACE, OPERATION_UPDATE, PatchRequests } from './types';

export interface ConfigurationRouterProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
}

const ENTITY_KEY = 'entity';

const getDefinition = async (
  configurationServiceId: AdspId,
  repository: ConfigurationRepository,
  namespace: string,
  name: string,
  tenantId?: AdspId
): Promise<ConfigurationDefinition> => {
  const key = `${namespace}:${name}`;
  const core = await repository.get<ConfigurationDefinitions>(
    configurationServiceId.namespace,
    configurationServiceId.service
  );
  if (core?.latest?.configuration[key]) {
    return core.latest.configuration[key];
  } else if (tenantId) {
    const tenant = await repository.get<ConfigurationDefinitions>(
      configurationServiceId.namespace,
      configurationServiceId.service,
      tenantId
    );
    return tenant?.latest?.configuration[key] || tenant?.latest?.configuration[namespace];
  } else {
    return null;
  }
};

export const getConfigurationEntity = (
  configurationServiceId: AdspId,
  repository: ConfigurationRepository,
  requestCore = (_req: Request): boolean => false
): RequestHandler => async (req, _res, next) => {
  const user = req.user;
  const { namespace, name } = req.params;
  const { tenantId: tenantIdValue } = req.query;
  const getCore = requestCore(req);

  try {
    const tenantId = user?.isCore && tenantIdValue ? AdspId.parse(tenantIdValue as string) : user.tenantId;

    const definition = await getDefinition(configurationServiceId, repository, namespace, name, tenantId);

    const entity = await repository.get(namespace, name, getCore ? null : tenantId, definition?.configurationSchema);
    if (!entity.canAccess(user)) {
      throw new UnauthorizedUserError('access configuration', user);
    }

    req[ENTITY_KEY] = entity;
    next();
  } catch (err) {
    next(err);
  }
};

const mapConfiguration = (configuration: ConfigurationEntity): unknown => ({
  namespace: configuration.namespace,
  name: configuration.name,
  latest: configuration.latest,
});

export const getConfiguration = (mapResult = mapConfiguration): RequestHandler => async (req, res) => {
  const configuration: ConfigurationEntity = req[ENTITY_KEY];
  res.send(mapResult(configuration));
};

export const patchConfigurationRevision = (eventService: EventService): RequestHandler => async (req, res, next) => {
  const user = req.user;
  const request: PatchRequests = req.body;

  try {
    const entity: ConfigurationEntity = req[ENTITY_KEY];

    let update: Record<string, unknown> = null;
    switch (request.operation) {
      case OPERATION_REPLACE:
        if (!request.configuration) {
          throw new InvalidOperationError(`Replace request must include 'configuration' property.`);
        }
        update = request.configuration;
        break;
      case OPERATION_UPDATE:
        if (!request.update) {
          throw new InvalidOperationError(`Update request must include 'update' property.`);
        }
        update = {
          ...(entity.latest?.configuration || {}),
          ...request.update,
        };
        break;
      case OPERATION_DELETE:
        if (!request.property) {
          throw new InvalidOperationError(`Delete request must include 'property' property.`);
        }
        update = entity.latest?.configuration || {};
        delete update[request.property];
        break;
      default:
        throw new InvalidOperationError('Request does not include recognized operation.');
    }
    const updated = await entity.update(user, update);

    res.send(mapConfiguration(updated));
    if (updated.tenantId) {
      eventService.send(
        configurationUpdated(updated.tenantId, updated.namespace, updated.name, updated.latest?.revision)
      );
    }
  } catch (err) {
    next(err);
  }
};

export const createConfigurationRevision = (eventService: EventService): RequestHandler => async (req, res, next) => {
  const user = req.user;
  const { revision = false } = req.body;
  if (!revision) {
    next(new InvalidOperationError('Request operation not recognized.'));
    return;
  }

  try {
    const configuration: ConfigurationEntity = req[ENTITY_KEY];
    const updated = await configuration.createRevision(user);

    res.send(mapConfiguration(updated));
    if (updated.tenantId) {
      eventService.send(revisionCreated(updated.tenantId, updated.namespace, updated.name, updated.latest?.revision));
    }
  } catch (err) {
    next(err);
  }
};

export const getRevisions = (
  getCriteria = (_req: Request) => ({}),
  mapResults = (_req: Request, results: Results<ConfigurationRevision>): unknown => results
): RequestHandler => async (req, res, next) => {
  const { top: topValue, after: afterValue } = req.query;

  try {
    const top = topValue ? parseInt(topValue as string) : 10;
    const after = afterValue as string;
    const criteria = getCriteria(req);

    const entity: ConfigurationEntity = req[ENTITY_KEY];
    const results = await entity.getRevisions(top, after, criteria);
    res.send(mapResults(req, results));
  } catch (err) {
    next(err);
  }
};

export function createConfigurationRouter({
  logger: _logger,
  serviceId,
  eventService,
  configuration: configurationRepository,
}: ConfigurationRouterProps): Router {
  const router = Router();

  router.get(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    getConfigurationEntity(serviceId, configurationRepository, (req) => req.query.core !== undefined),
    getConfiguration()
  );

  router.get(
    '/configuration/:namespace/:name/latest',
    assertAuthenticatedHandler,
    getConfigurationEntity(serviceId, configurationRepository, (req) => req.query.core !== undefined),
    getConfiguration((configuration) => configuration.latest?.configuration || {})
  );

  router.patch(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    getConfigurationEntity(serviceId, configurationRepository),
    patchConfigurationRevision(eventService)
  );

  router.post(
    '/configuration/:namespace/:name',
    assertAuthenticatedHandler,
    getConfigurationEntity(serviceId, configurationRepository),
    createConfigurationRevision(eventService)
  );

  router.get(
    '/configuration/:namespace/:name/revisions',
    assertAuthenticatedHandler,
    getConfigurationEntity(serviceId, configurationRepository),
    getRevisions()
  );

  router.get(
    '/configuration/:namespace/:name/revisions/:revision',
    assertAuthenticatedHandler,
    getConfigurationEntity(serviceId, configurationRepository),
    getRevisions(
      (req) => ({ revision: req.params.revision }),
      (req, { results }) => {
        if (results.length < 1) {
          throw new NotFoundError('revision', req.params.revision);
        }
        return results[0]?.configuration;
      }
    )
  );

  return router;
}
