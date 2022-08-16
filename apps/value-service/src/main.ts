import * as express from 'express';
import * as passport from 'passport';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { environment } from './environments/environment';
import { logger } from './logger';
import {
  applyValuesMiddleware,
  configurationSchema,
  Namespace,
  NamespaceEntity,
  ServiceUserRoles,
  ValueWrittenDefinition,
} from './values';
import { createRepositories } from './timescale';
import { AdspId, initializePlatform } from '@abgov/adsp-service-sdk';
import { AjvValueValidationService } from './ajv';
import type { User } from '@abgov/adsp-service-sdk';

const initializeApp = async () => {
  const app = express();

  app.use(compression());
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  if (environment.TRUSTED_PROXY) {
    app.set('trust proxy', environment.TRUSTED_PROXY);
  }

  const repositories = await createRepositories({ ...environment, logger });

  const { coreStrategy, tenantStrategy, tenantHandler, configurationHandler, eventService, healthCheck } =
    await initializePlatform(
      {
        serviceId: AdspId.parse(environment.CLIENT_ID),
        displayName: 'Value service',
        description: 'Service for time-series values.',
        roles: [
          {
            role: ServiceUserRoles.Reader,
            description: 'Reader role for accessing values.',
            inTenantAdmin: true,
          },
          {
            role: ServiceUserRoles.Writer,
            description: 'Writer role for writing new values.',
          },
        ],
        configuration: {
          description: 'Definitions for values including write schema and option to enable write events.',
          schema: configurationSchema,
        },
        events: [ValueWrittenDefinition],
        clientSecret: environment.CLIENT_SECRET,
        directoryUrl: new URL(environment.DIRECTORY_URL),
        accessServiceUrl: new URL(environment.KEYCLOAK_ROOT_URL),
        configurationConverter: (config: Record<string, Namespace>, tenantId) => {
          return config
            ? Object.getOwnPropertyNames(config).reduce(
                (namespaces, namespace) => ({
                  ...namespaces,
                  [namespace]: new NamespaceEntity(
                    new AjvValueValidationService(logger),
                    repositories.valueRepository,
                    config[namespace],
                    tenantId
                  ),
                }),
                {}
              )
            : null;
        },
        combineConfiguration: (
          tenantConfig: Record<string, NamespaceEntity>,
          coreConfig: Record<string, NamespaceEntity>
        ) => [
          {
            ...tenantConfig,
            ...coreConfig,
          },
        ],
      },
      { logger }
    );

  passport.use('core', coreStrategy);
  passport.use('tenant', tenantStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user as User);
  });

  app.use(passport.initialize());
  app.use(
    '/value',
    passport.authenticate(['core', 'tenant'], { session: false }),
    assertAuthenticatedHandler,
    tenantHandler,
    configurationHandler
  );

  applyValuesMiddleware(app, { logger, repository: repositories.valueRepository, eventService });

  const errorHandler = createErrorHandler(logger);
  app.use(errorHandler);

  app.use('/health', async (_req, res) => {
    const platform = await healthCheck();
    res.json({
      db: await repositories.isConnected(),
      ...platform,
    });
  });

  app.get('/', async (req, res) => {
    const rootUrl = new URL(`${req.protocol}://${req.get('host')}`);
    res.json({
      name: 'Value service',
      description: 'Service for time-series values.',
      _links: {
        self: { href: new URL(req.originalUrl, rootUrl).href },
        health: { href: new URL('/health', rootUrl).href },
        api: { href: new URL('/value/v1', rootUrl).href },
        docs: { href: new URL('/swagger/docs/v1', rootUrl).href },
      },
    });
  });

  return app;
};

initializeApp().then((app) => {
  const port = process.env.PORT || 3336;

  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
});
