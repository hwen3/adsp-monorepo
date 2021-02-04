import { Request, Response, Router } from 'express';
import { TenantConfigurationRepository } from '../repository';
import { mapTenantConfig } from './mappers';
import { TenantConfigEntity } from '../model';
import { NotFoundError } from '@core-services/core-common';

interface TenantConfigRouterProps {
  tenantConfigurationRepository: TenantConfigurationRepository;
}

export const createTenantConfigurationRouter = ({
  tenantConfigurationRepository,
}: TenantConfigRouterProps) => {
  const tenantConfigRouter = Router();

  /**
   * @swagger
   *
   * /configuration/v1/tenantConfig/{realmName}:
   *   get:
   *     tags:
   *     - Subscription
   *     description: Retrieves tenant configuation for a realm.
   *     parameters:
   *     - name: realmName
   *       description: Name of the realm.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *
   *     responses:
   *       200:
   *         description: Tenant configuration succesfully retrieved.
   */
  tenantConfigRouter.get(
    '/:realmName',

    (req, res, next) => {

      const { realmName } = req.params;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {

          if (!tenantConfigEntity) {
            throw new NotFoundError('Tenant Config', realmName);
          } else {
            res.json(mapTenantConfig(tenantConfigEntity));
          }
        })
        .catch((err) => next(err));
    }
  );

  /**
   * @swagger
   *
   * /configuration/v1/tenantConfig/:
   *   post:
   *     tags:
   *     - TenantConfig
   *     description: Creates a tenant realm configuration.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object

   *     responses:
   *       200:
   *         description: Tenant Configuration succesfully created.
   */
  tenantConfigRouter.post(
    '/',
    (req: Request, res: Response, next) => {
      const { realmName } = req.params;
      const data = req.body;

      tenantConfigurationRepository
        .get(realmName)
        .then((tenantConfigEntity) => {
          if (!tenantConfigEntity) {
            TenantConfigEntity.delete(tenantConfigurationRepository, {
              ...data,
              config: data
            });

            return TenantConfigEntity.create(tenantConfigurationRepository, {
              ...data,
              tenantConfig: data
            });
          } else {
            return TenantConfigEntity.create(tenantConfigurationRepository, {
              ...data,
              tenantConfig: data,
            });
          }
        })
        .then((entity) => {
          res.send(mapTenantConfig(entity));
          return entity;
        })
        .catch((err) => next(err));
    }
  );

  return tenantConfigRouter;
};
