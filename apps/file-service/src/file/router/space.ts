import { Logger } from 'winston';
import { Router } from 'express';
import {
  assertAuthenticatedHandler,
  User,
  UnauthorizedError,
  NotFoundError,
  DomainEventService,
} from '@core-services/core-common';
import { FileSpaceRepository } from '../repository';
import { FileSpaceEntity } from '../model';
import { createdFileSpace, updatedFileSpace } from '../event/space';

interface SpaceRouterProps {
  logger: Logger;
  eventService: DomainEventService;
  spaceRepository: FileSpaceRepository;
}

export const createSpaceRouter = ({
  logger,
  eventService,
  spaceRepository,
}: SpaceRouterProps) => {
  const spaceRouter = Router();

  /**
   * @swagger
   *
   * /space/v1/spaces:
   *   get:
   *     tags:
   *     - File Space
   *     description: Retrieves file spaces.
   *     parameters:
   *     - name: top
   *       description: Number of results to retrieve.
   *       in: query
   *       required: false
   *       schema:
   *         type: number
   *     - name: after
   *       description: Cursor to continue a previous request.
   *       in: query
   *       required: false
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: File spaces succesfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 page:
   *                   type: object
   *                   properties:
   *                     size:
   *                       type: number
   *                     after:
   *                       type: string
   *                     next:
   *                       type: string
   *                 results:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       spaceAdminRole:
   *                         type: string
   */
  spaceRouter.get(
    '/spaces',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user = req.user as User;
      const { top, after } = req.query;

      try {
        var spaces = await spaceRepository.find(
          parseInt((top as string) || '10', 10),
          after as string
        );
        res.send({
          page: spaces.page,
          results: spaces.results
            .filter((n) => n.canAccess(user))
            .map((n) => ({
              id: n.id,
              name: n.name,
              spaceAdminRole: n.spaceAdminRole,
            })),
        });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /space/v1/spaces/{space}:
   *   get:
   *     tags:
   *     - File Space
   *     description: Retrieves a specified file space.
   *     parameters:
   *     - name: space
   *       description: ID of the space to retrieve.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     responses:
   *       200:
   *         description: Space successfully retrieved.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 name:
   *                   type: string
   *                 spaceAdminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to access file space.
   *       404:
   *         description: File space not found.
   */
  spaceRouter.get(
    '/spaces/:space',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user = req.user as User;
      const { space } = req.params;

      try {
        var spaceEntity = await spaceRepository.get(space);

        if (!spaceEntity) {
          throw new NotFoundError('Space', space);
        } else if (!spaceEntity.canAccess(user)) {
          throw new UnauthorizedError('User not authorized to access space.');
        } else {
          res.json({
            id: spaceEntity.id,
            name: spaceEntity.name,
            spaceAdminRole: spaceEntity.spaceAdminRole,
          });
        }
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * @swagger
   *
   * /space/v1/spaces/{space}:
   *   put:
   *     tags:
   *     - File Space
   *     description: Creates or updates a file space.
   *     parameters:
   *     - name: space
   *       description: ID of the space to create or update.
   *       in: path
   *       required: true
   *       schema:
   *         type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               spaceAdminRole:
   *                 type: string
   *     responses:
   *       200:
   *         description: Space successfully created or updated.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 name:
   *                   type: string
   *                 spaceAdminRole:
   *                   type: string
   *       401:
   *         description: User not authorized to update file space.
   */
  spaceRouter.put(
    '/spaces/:space',
    assertAuthenticatedHandler,
    async (req, res, next) => {
      const user = req.user as User;
      const { space } = req.params;
      const { spaceAdminRole, name } = req.body;

      try {
        var spaceEntity = await spaceRepository.get(space);

        if (!spaceEntity) {
          var entity = await FileSpaceEntity.create(user, spaceRepository, {
            id: space,
            spaceAdminRole,
            name,
          });

          eventService.send(
            createdFileSpace(
              {
                id: entity.id,
                name: entity.name,
                spaceAdminRole: entity.spaceAdminRole,
              },
              user,
              new Date()
            )
          );
        } else {
          var entity = await spaceEntity.update(user, { spaceAdminRole, name });

          eventService.send(
            updatedFileSpace(
              {
                id: entity.id,
                name: entity.name,
                spaceAdminRole: entity.spaceAdminRole,
              },
              user,
              new Date()
            )
          );
        }

        logger.info(
          `Space ${spaceEntity.name} (ID: ${space}) updated by ` +
            `user ${user.name} (ID: ${user.id}).`
        );

        res.send({
          id: spaceEntity.id,
          name: spaceEntity.name,
          spaceAdminRole: spaceEntity.spaceAdminRole,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return spaceRouter;
};
