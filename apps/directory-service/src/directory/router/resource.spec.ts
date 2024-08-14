import { AdspId, adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createResourceRouter, getTaggedResources, getTags, tagOperation } from './resource';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { ServiceRoles } from '../roles';
import { InvalidOperationError } from '@core-services/core-common';

describe('resource', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const repositoryMock = {
    find: jest.fn(),
    getDirectories: jest.fn(),
    exists: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    getTags: jest.fn(),
    getTaggedResources: jest.fn(),
    applyTag: jest.fn(),
    removeTag: jest.fn(),
    saveResource: jest.fn(),
    deleteResource: jest.fn(),
  };

  beforeEach(() => {
    eventServiceMock.send.mockClear();
    repositoryMock.getTags.mockClear();
    repositoryMock.getTaggedResources.mockClear();
    repositoryMock.applyTag.mockClear();
    repositoryMock.removeTag.mockClear();
    directoryMock.getResourceUrl.mockClear();
  });

  it('can create router', () => {
    const router = createResourceRouter({
      logger: loggerMock,
      directory: directoryMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getTags', () => {
    it('can create handler', () => {
      const handler = getTags(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tags', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getTags(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining(results[0])]),
        })
      );
    });

    it('can get tags with query params', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: { top: '42', after: '123', resource: 'urn:ads:platform:file-service:v1:/files' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getTags(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        42,
        '123',
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining(results[0])]),
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTags(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('tagOperation', () => {
    it('can create handler', () => {
      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can tag resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            label: 'Test tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const tag = {
        label: 'Test tag',
        value: 'test-tag',
      };
      const resource = {
        urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
      };
      repositoryMock.applyTag.mockResolvedValueOnce({ tag, resource, tagged: true });

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.applyTag).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ...tag }),
        expect.objectContaining({ tenantId, urn: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tagged: true,
          tag: expect.objectContaining(tag),
          resource: expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'tagged-resource',
        })
      );
    });

    it('can untag resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'untag-resource',
          tag: {
            label: 'Test tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const tag = {
        label: 'Test tag',
        value: 'test-tag',
      };
      const resource = {
        urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
      };
      repositoryMock.removeTag.mockResolvedValueOnce({ tag, resource, untagged: true });

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.removeTag).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ...tag }),
        expect.objectContaining({ tenantId, urn: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          untagged: true,
          tag: expect.objectContaining(tag),
          resource: expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'untagged-resource',
        })
      );
    });

    it('can tag resource with tag value', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const tag = {
        label: 'Test tag',
        value: 'test-tag',
      };
      const resource = {
        urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
      };
      repositoryMock.applyTag.mockResolvedValueOnce({ tag, resource, tagged: true });

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.applyTag).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ...req.body.tag }),
        expect.objectContaining({ tenantId, urn: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tagged: true,
          tag: expect.objectContaining(tag),
          resource: expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'tagged-resource',
        })
      );
    });

    it('can call next with unauthorized user', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        body: {
          operation: 'other-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with invalid operation for unrecognized operation', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'other-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for missing tag', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for tag without label and value', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {},
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for missing resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for resource with invalid urn', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: ':ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for resource with non-resource urn', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for resource not resolved by directory', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(null);

      const handler = tagOperation(loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getTaggedResources', () => {
    it('can create handler', () => {
      const handler = getTaggedResources(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tagged resources', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-tag' },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      const page = {};
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results, page });

      const handler = getTaggedResources(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTaggedResources).toHaveBeenCalledWith(tenantId, 'test-tag', 10, undefined);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
          ]),
          page,
        })
      );
    });

    it('can get tagged resources with query params', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-tag' },
        query: { top: '15', after: '123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      const page = {};
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results, page });

      const handler = getTaggedResources(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTaggedResources).toHaveBeenCalledWith(tenantId, 'test-tag', 15, '123');
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
          ]),
          page,
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { tag: 'test-tag' },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTaggedResources(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
