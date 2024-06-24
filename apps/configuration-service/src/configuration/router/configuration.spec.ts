import { adspId, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { ConfigurationEntity } from '../model';
import { ConfigurationServiceRoles } from '../roles';
import {
  createConfigurationRouter,
  configurationOperations,
  getConfiguration,
  getConfigurationEntity,
  patchConfigurationRevision,
  getRevisions,
  getActiveRevision,
} from './configuration';
import { RateLimitRequestHandler } from 'express-rate-limit';

describe('router', () => {
  const configurationServiceId = adspId`urn:ads:platform:configuration-service`;
  const namespace = 'platform';
  const name = 'test-service';
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown;

  const eventServiceMock = {
    send: jest.fn(),
  };

  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const repositoryMock = {
    get: jest.fn(),
    getRevisions: jest.fn(),
    saveRevision: jest.fn(),
  };

  const activeRevisionMock = {
    get: jest.fn(),
    setActiveRevision: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.get.mockClear();
    eventServiceMock.send.mockClear();
  });

  describe('createConfigurationRouter', () => {
    it('can create router', () => {
      const router = createConfigurationRouter({
        isConnected: () => true,
        serviceId: adspId`urn:ads:platform:configuration-service`,
        eventService: eventServiceMock,
        logger: loggerMock as Logger,
        configuration: repositoryMock,
      });

      expect(router).toBeTruthy();
    });
  });

  describe('getServiceConfigurationEntity', () => {
    it('can create handler', () => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler
      );
      expect(handler).toBeTruthy();
    });

    it('can get entity', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        true,
        () => true
      );

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock
        )
      );
      activeRevisionMock.get.mockResolvedValueOnce({
        namespace: configurationServiceId.namespace,
        name: configurationServiceId.service,
        tenant: tenantId,
        active: 2,
      });
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock,
          null,
          tenantId
        )
      );

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        isAuthenticated: jest.fn(() => true),
      } as unknown as Request;

      handler(req, null, () => {
        try {
          expect(req['entity']).toBe(entity);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('can get entity and not load definition', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        false,
        () => true
      );

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        isAuthenticated: jest.fn(() => true),
      } as unknown as Request;

      handler(req, null, () => {
        try {
          expect(req['entity']).toBe(entity);
          expect(repositoryMock.get).toBeCalledTimes(1);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('can get tenant entity', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        true,
        () => false
      );

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock
        )
      );
      activeRevisionMock.get.mockResolvedValueOnce({
        namespace: configurationServiceId.namespace,
        name: configurationServiceId.service,
        tenant: tenantId,
        active: 2,
      });
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock,
          null,
          tenantId
        )
      );

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User,
        params: { namespace, name },
        query: { tenantId: tenantId.toString() },
        isAuthenticated: jest.fn(() => true),
      } as unknown as Request;

      handler(req, null, () => {
        try {
          expect(req['entity']).toBe(entity);
          expect(repositoryMock.get.mock.calls[2][2].toString()).toEqual(tenantId.toString());
          done();
        } catch (err) {
          done(err);
        }
      });
    });
    it('can get configuration entity for unauthenticated users.', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        true,
        () => false
      );

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock
        )
      );

      activeRevisionMock.get.mockResolvedValueOnce({
        namespace: configurationServiceId.namespace,
        name: configurationServiceId.service,
        tenant: tenantId,
        active: 2,
      });
      const configurationSchema = {};

      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [`${namespace}:${name}`]: { configurationSchema },
              [namespace]: { configurationSchema: {} },
            },
          },
          tenantId
        )
      );

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );

      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: null,
        params: { namespace, name },
        query: { tenantId: tenantId.toString() },
        isAuthenticated: jest.fn(() => true),
      } as unknown as Request;

      handler(req, null, () => {
        try {
          expect(req.user).toBeNull();
          expect(repositoryMock.get.mock.calls[2][3]).toEqual(expect.objectContaining({ configurationSchema }));
          expect(repositoryMock.get.mock.calls[2][2].toString()).toEqual(tenantId.toString());
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('can get entity with core definition', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        true,
        () => false
      );

      // Configuration definition retrieval.
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [`${namespace}:${name}`]: { configurationSchema },
            },
          }
        )
      );

      activeRevisionMock.get.mockResolvedValueOnce({
        namespace: configurationServiceId.namespace,
        name: configurationServiceId.service,
        tenant: tenantId,
        active: 2,
      });

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );

      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        isAuthenticated: jest.fn(() => true),
      };

      handler(req as unknown as Request, null, () => {
        try {
          expect(req['entity']).not.toBeNull();
          expect(req['entity'].name).toBe(entity.name);
          expect(repositoryMock.get.mock.calls[1][3]).toEqual(expect.objectContaining({ configurationSchema }));
          expect(repositoryMock.get.mock.calls.length).toBeGreaterThan(0);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('can get entity with tenant definition', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        true,
        () => false
      );

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock
        )
      );

      activeRevisionMock.get.mockResolvedValueOnce({
        namespace: configurationServiceId.namespace,
        name: configurationServiceId.service,
        tenant: tenantId,
        active: 2,
      });
      const configurationSchema = {};

      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [`${namespace}:${name}`]: { configurationSchema },
              [namespace]: { configurationSchema: {} },
            },
          },
          tenantId
        )
      );

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );

      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        isAuthenticated: jest.fn(() => true),
      } as unknown as Request;

      handler(req, null, () => {
        try {
          expect(req['entity']).not.toBeNull();
          expect(req['entity'].name).toBe(entity.name);
          expect(repositoryMock.get.mock.calls[2][3]).toEqual(expect.objectContaining({ configurationSchema }));
          expect(repositoryMock.get.mock.calls.length).toBeGreaterThan(0);
          done();
        } catch (err) {
          done(err);
        }
      });
    });

    it('can get entity with tenant namespace definition', (done) => {
      const rateLimitHandler = jest.fn();
      const handler = getConfigurationEntity(
        configurationServiceId,
        repositoryMock,
        rateLimitHandler as unknown as RateLimitRequestHandler,
        true,
        () => false
      );

      // Configuration definition retrieval.
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock
        )
      );

      activeRevisionMock.get.mockResolvedValueOnce({
        namespace: configurationServiceId.namespace,
        name: configurationServiceId.service,
        tenant: tenantId,
        active: 2,
      });
      const configurationSchema = {};
      repositoryMock.get.mockResolvedValueOnce(
        new ConfigurationEntity(
          configurationServiceId.namespace,
          configurationServiceId.service,
          loggerMock as Logger,
          repositoryMock,
          activeRevisionMock,
          validationMock,
          {
            revision: 1,
            configuration: {
              [namespace]: { configurationSchema },
            },
          },
          tenantId
        )
      );

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );
      repositoryMock.get.mockResolvedValueOnce(entity);

      const req = {
        tenant: { id: tenantId },
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        isAuthenticated: jest.fn(() => true),
      } as unknown as Request;

      handler(req, null, () => {
        try {
          expect(req['entity']).not.toBeNull();
          expect(req['entity'].name).toBe(entity.name);
          expect(repositoryMock.get.mock.calls[2][3]).toEqual(expect.objectContaining({ configurationSchema }));
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe('getServiceConfiguration', () => {
    it('can create handler', () => {
      const handler = getConfiguration();
      expect(handler).toBeTruthy();
    });

    it('can get configuration', () => {
      const handler = getConfiguration();

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock as Logger,
        repositoryMock,
        activeRevisionMock,
        validationMock,
        null,
        tenantId
      );

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      handler(req, res as unknown as Response, jest.fn());
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ latest: null, namespace, name }));
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('patchServiceConfigurationRevision', () => {
    it('can create handler', () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can update', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        mergeUpdate: jest.fn((update) => ({ ...entity.latest?.configuration, ...update })),
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' }, lastUpdated: new Date() },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
          update: {
            value: 'value',
          },
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining({ ...req.body.update, old: 'old' }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        latest: { lastUpdated: expect.any(Date) },
      });
    });

    it('can handle no existing revision on update', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        mergeUpdate: jest.fn((update) => ({ ...entity.latest?.configuration, ...update })),
        update: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
          update: {
            value: 'value',
          },
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining(req.body.update));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can return error for update missing value', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        mergeUpdate: jest.fn((update) => ({ ...entity.latest?.configuration, ...update })),
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });

    it('can handle unchanged configuration', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        mergeUpdate: jest.fn((update) => ({ ...entity.latest?.configuration, ...update })),
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { value: 'value', other: 'other' } },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'UPDATE',
          update: {
            value: 'value',
          },
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can replace', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' }, lastUpdated: new Date() },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'REPLACE',
          configuration: {
            value: 'value',
          },
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(
        req.user,
        expect.objectContaining<{ value: string }>(req.body.configuration)
      );
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        latest: { lastUpdated: expect.any(Date) },
      });
    });

    it('can return error for replace without value', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'REPLACE',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });

    it('can delete', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' }, lastUpdated: new Date() },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'old',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.not.objectContaining({ old: 'old' }));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        latest: { lastUpdated: expect.any(Date) },
      });
    });

    it('can delete at path', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: { nested: 'old' } }, lastUpdated: new Date() },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'old.nested',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(
        req.user,
        expect.objectContaining({ old: expect.not.objectContaining({ nested: 'old' }) })
      );
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        latest: { lastUpdated: expect.any(Date) },
      });
    });

    it('can handle no existing revision on delete', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'missing',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).toHaveBeenCalledWith(req.user, expect.objectContaining({}));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('can handle missing property on delete', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
          property: 'missing',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.update).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
    });

    it('can return error for delete without property', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'DELETE',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });

    it('can return error for unrecognized operation', async () => {
      const handler = patchConfigurationRevision(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        update: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: { old: 'old' } },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'NOP',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
      expect(eventServiceMock.send).toHaveBeenCalledTimes(0);
    });
  });

  describe('configurationOperations', () => {
    it('can create handler', () => {
      const handler = configurationOperations(loggerMock as Logger, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can create revision', async () => {
      const handler = configurationOperations(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: { revision: 1, configuration: {}, created: new Date() },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'CREATE-REVISION',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.createRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot({
        latest: { created: expect.any(Date) },
      });
    });

    it('can create first revision', async () => {
      const handler = configurationOperations(loggerMock as Logger, eventServiceMock);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        latest: null,
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'CREATE-REVISION',
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ namespace, name, latest: entity.latest }));
      expect(entity.createRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
    });

    it('fails when trying to set nonexistent revision', async () => {
      const handler = configurationOperations(loggerMock as Logger, eventServiceMock);

      const revisionValue = 5;

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        latest: null,
      };

      const activeRevisionEntity = {
        get: jest.fn(),
        setActiveRevision: jest.fn(),
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        activeRevisionEntity,
        query: {},
        body: {
          operation: 'SET-ACTIVE-REVISION',
          setActiveRevision: revisionValue,
        },
      } as unknown as Request;

      entity.getRevisions.mockResolvedValueOnce({ results: [null] });

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(new InvalidOperationError(`The selected revision does not exist`));
    });

    it('fails because parameters are not set', async () => {
      const handler = configurationOperations(loggerMock as Logger, eventServiceMock);

      const revisionValue = 5;

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        setActiveRevision: jest.fn(),
        latest: null,
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'SET-ACTIVE-REVISION',
        },
      } as unknown as Request;

      const active = {
        revision: revisionValue,
      };

      entity.getRevisions.mockResolvedValueOnce({ results: [{ revision: 1 }, { revision: 2 }, { revision: 3 }] });
      entity.setActiveRevision.mockResolvedValueOnce(active);

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(
        new InvalidOperationError('Set active revision request must include setActiveRevision property.')
      );
    });

    it('can set the active revision', async () => {
      const handler = configurationOperations(loggerMock as Logger, eventServiceMock);

      const revisionValue = 2;

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        setActiveRevision: jest.fn(),
        latest: null,
      };

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
        body: {
          operation: 'SET-ACTIVE-REVISION',
          setActiveRevision: revisionValue,
        },
      } as unknown as Request;

      const active = revisionValue;

      entity.getRevisions.mockResolvedValueOnce({
        results: [{ revision: revisionValue }],
      });

      entity.getActiveRevision.mockResolvedValueOnce(1);
      entity.setActiveRevision.mockResolvedValueOnce(active);

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace,
          name,
          tenantId,
          active: revisionValue,
        })
      );
      expect(entity.setActiveRevision).toHaveBeenCalledTimes(1);
      expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('getActiveRevision', () => {
    it('throws errors when there are no active revisions', async () => {
      const handler = getActiveRevision(loggerMock as Logger);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        latest: null,
      };

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      };

      const next = jest.fn();

      entity.getActiveRevision.mockResolvedValueOnce(undefined);

      await handler(req, res as unknown as Response, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith([]);
    });

    it('can get active revision', async () => {
      const handler = getActiveRevision(loggerMock as Logger);

      const activeRevision = 3;

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        latest: null,
      };

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;

      entity.getActiveRevision.mockResolvedValueOnce(activeRevision);

      entity.getRevisions.mockResolvedValueOnce({
        results: [{ namespace: namespace, name: name, revision: activeRevision, data: { a: 42 } }],
      });

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: namespace, name: name, revision: activeRevision, data: { a: 42 } })
      );
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can get active revision with no user context', async () => {
      const handler = getActiveRevision(loggerMock as Logger);

      const activeRevision = 3;

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        latest: null,
      };

      const req = {
        entity,
        user: null,
        params: { namespace, name },
        query: {},
      } as unknown as Request;

      entity.getActiveRevision.mockResolvedValueOnce(activeRevision);

      entity.getRevisions.mockResolvedValueOnce({
        results: [{ namespace: namespace, name: name, revision: activeRevision, data: { a: 42 } }],
      });

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: namespace, name: name, revision: activeRevision, data: { a: 42 } })
      );
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can get active revision at revision 0', async () => {
      const handler = getActiveRevision(loggerMock as Logger);

      const activeRevision = 3;

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        latest: null,
      };

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: {},
      } as unknown as Request;

      entity.getActiveRevision.mockResolvedValueOnce(0);
      entity.getRevisions.mockResolvedValueOnce({
        results: [{ namespace: namespace, name: name, revision: activeRevision, data: { a: 42 } }],
      });

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ namespace: namespace, name: name, revision: activeRevision, data: { a: 42 } })
      );
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    it('can fallback to latest for no active revision', async () => {
      const handler = getActiveRevision(loggerMock as Logger);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        latest: { namespace: namespace, name: name, revision: 12, data: { a: 42 } },
      };

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: { orLatest: 'true' },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      entity.getActiveRevision.mockResolvedValueOnce(undefined);

      await handler(req, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(entity.latest);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });

    // This differs from the above in that the active revision value is set but no result is found for it.
    // Perhaps this should be an error since it means the persisted data is not consistent, but consumer would
    // have no resolution for the issue.
    it('can fallback to latest for active revision not found', async () => {
      const handler = getActiveRevision(loggerMock as Logger);

      const entity = {
        tenantId,
        namespace,
        name,
        createRevision: jest.fn(() => Promise.resolve(entity)),
        getRevisions: jest.fn(),
        getActiveRevision: jest.fn(),
        latest: { namespace: namespace, name: name, revision: 12, data: { a: 42 } },
      };

      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: { orLatest: 'true' },
      } as unknown as Request;

      entity.getActiveRevision.mockResolvedValueOnce(1);
      entity.getRevisions.mockResolvedValueOnce({
        results: [],
      });

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      await handler(req, res as unknown as Response, next);

      expect(res.send).toHaveBeenCalledWith(entity.latest);
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });
  });

  describe('getRevisions', () => {
    it('can create handler', () => {
      const handler = getRevisions();
      expect(handler).toBeTruthy();
    });

    it('can get revisions', async () => {
      const handler = getRevisions();

      const entity = {
        tenantId,
        namespace,
        name,
        getRevisions: jest.fn(),
        latest: { revision: 1, configuration: {} },
      };
      const req = {
        entity,
        user: { isCore: false, roles: [ConfigurationServiceRoles.Reader], tenantId } as User,
        params: { namespace, name },
        query: { top: '12', after: '123' },
        body: {
          revision: true,
        },
      } as unknown as Request;

      const res = {
        send: jest.fn(),
      };

      const next = jest.fn();

      const result = {};
      entity.getRevisions.mockResolvedValueOnce(result);
      await handler(req, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(result);
      expect(entity.getRevisions).toHaveBeenCalledWith(12, '123', {});
      expect(res.send.mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
