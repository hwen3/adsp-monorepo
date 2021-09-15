import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import axios, { AxiosRequestConfig } from 'axios';
import { Router } from 'express';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntry, PublicServiceStatusType } from '../types';
import { environment } from '../../environments/environment';

export interface ServiceStatusRouterProps {
  logger: Logger;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
}

export function createServiceStatusRouter({
  logger,
  serviceStatusRepository,
  endpointStatusEntryRepository,
}: ServiceStatusRouterProps): Router {
  const router = Router();

  // Get the service for the tenant
  router.get('/applications', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);
    const { tenantId } = req.user;
    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    const applications = await serviceStatusRepository.find({ tenantId: tenantId.toString() });

    res.json(applications);
  });

  // Enable the service
  router.patch('/applications/:id/enable', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);
    const user = req.user as Express.User;
    const { id } = req.params;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.enable({ ...req.user } as User);
    res.json(updatedApplication);
  });

  // Disable the service
  router.patch('/applications/:id/disable', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);
    const user = req.user;
    const { id } = req.params;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.disable({ ...req.user } as User);
    res.json(updatedApplication);
  });

  // add application
  router.post('/applications', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user;
    const { name, description, endpoints, metadata } = req.body;
    const tenantId = user.tenantId?.toString() ?? '';

    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    const url = `/api/tenant/v1/${tenantId.split('/')[tenantId.split('/').length - 1]}`;
    const http = axios.create({ baseURL: environment.TENANT_MANAGEMENT_API_HOST });
    http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${user.token.bearer}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });

    let response = null;

    try {
      response = await http.get(url);
    } catch (e) {
      console.log('error:' + e);
    }

    const tenantName = response.data.tenant.name;
    const tenantRealm = response.data.tenant.realm;

    const app = await ServiceStatusApplicationEntity.create({ ...(req.user as User) }, serviceStatusRepository, {
      name,
      description,
      tenantId,
      tenantName,
      tenantRealm,
      endpoints,
      metadata,
      statusTimestamp: 0,
      status: 'disabled',
      manualOverride: 'off',
    });
    res.status(201).json(app);
  });

  router.put('/applications/:id', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { name, description, endpoints } = req.body;
    const { id } = req.params;
    const tenantId = user.tenantId?.toString() ?? '';

    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    // TODO: this needs to be moved to a service
    const application = await serviceStatusRepository.get(id);
    if (tenantId !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.update({ ...user } as User, {
      name,
      description,
      endpoints,
    });
    res.status(200).json(updatedApplication);
  });

  router.delete('/applications/:id', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { id } = req.params;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    await application.delete({ ...user } as User);

    res.sendStatus(204);
  });

  router.patch('/applications/:id/status', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const user = req.user as Express.User;
    const { id } = req.params;
    const { status } = req.body;
    const application = await serviceStatusRepository.get(id);

    if (user.tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const updatedApplication = await application.setStatus(user, status as PublicServiceStatusType);
    res.status(200).json(updatedApplication);
  });

  router.get('/applications/:applicationId/endpoint-status-entries', async (req, res) => {
    logger.info(req.method, req.url);

    const { tenantId } = req.user;
    const { applicationId } = req.params;
    if (!tenantId) {
      throw new UnauthorizedError('missing tenant id');
    }

    const application = await serviceStatusRepository.get(applicationId);

    if (!application) {
      throw new NotFoundError('Status application', applicationId.toString());
    }

    if (tenantId?.toString() !== application.tenantId) {
      throw new UnauthorizedError('invalid tenant id');
    }

    const data = await Promise.all(
      application.endpoints.map(async (endpoint) => {
        const entries = await endpointStatusEntryRepository.findRecentByUrl(endpoint.url);
        return {
          url: endpoint.url,
          entries,
        };
      })
    );

    // map to a key:value (url: EndpointStatusEntry[]) dataset
    const entryMap: { [key: string]: EndpointStatusEntry[] } = {};
    data.forEach((item) => (entryMap[item.url] = item.entries));

    res.send(entryMap);
  });

  return router;
}
