import { EventService, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
} from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { FileEntity, FileTypeEntity } from '../model';
import { createUpload } from './upload';
import { fileDeleted, fileUploaded } from '../events';
import { ServiceConfiguration } from '../configuration';
import { FileStorageProvider } from '../storage';
import { use } from 'passport';

interface FileRouterProps {
  logger: Logger;
  storageProvider: FileStorageProvider;
  fileRepository: FileRepository;
  eventService: EventService;
}

function mapFileType(entity: FileTypeEntity) {
  return {
    id: entity.id,
    name: entity.name,
    anonymousRead: entity.anonymousRead,
    updateRoles: entity.updateRoles,
    readRoles: entity.readRoles,
  };
}

function mapFile(entity: FileEntity) {
  return {
    id: entity.id,
    filename: entity.filename,
    size: entity.size,
    typeName: entity.type?.name,
    recordId: entity.recordId,
    created: entity.created,
    createdBy: entity.createdBy,
    lastAccessed: entity.lastAccessed,
    scanned: entity.scanned,
  };
}

export const getTypes: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const [configuration] = await req.getConfiguration<ServiceConfiguration>();

    res.send(
      Object.values(configuration)
        .filter((t) => t.canAccess(user))
        .map(mapFileType)
    );
  } catch (err) {
    next(res);
  }
};

export function getType(_logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { fileTypeId } = req.params;
      const [configuration] = await req.getConfiguration<ServiceConfiguration>();

      const entity = configuration?.[fileTypeId];
      if (!entity) {
        throw new NotFoundError('File Type', fileTypeId);
      } else if (!entity.canAccess(user)) {
        throw new UnauthorizedUserError('Access file type', user);
      }

      res.send(mapFileType(entity));
    } catch (err) {
      next(err);
    }
  };
}

export function getFiles(repository: FileRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = user.tenantId;
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 50;
      let criteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      criteria = {
        ...criteria,
        tenantEquals: tenantId.toString(),
        deleted: false,
      };
      const files = await repository.find(top, after as string, criteria);

      res.send({
        page: files.page,
        results: files.results.filter((r) => r.canAccess(user)).map(mapFile),
      });
    } catch (err) {
      next(err);
    }
  };
}

export function uploadFile(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const fileEntity = req.fileEntity;
      if (!fileEntity) {
        throw new InvalidOperationError('No file uploaded.');
      }

      res.send(mapFile(fileEntity));

      // This is an example.
      eventService.send(
        fileUploaded(user, {
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
          createdBy: fileEntity.createdBy,
        })
      );

      logger.info(
        `File '${fileEntity.filename}' (ID: ${fileEntity.id}) uploaded by user '${user.name}' (ID: ${user.id}).`,
        {
          context: 'file-router',
          tenant: user?.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function getFile(repository: FileRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      const { fileId } = req.params;

      const fileEntity = await repository.get(fileId);
      if (!fileEntity) {
        throw new NotFoundError('File', fileId);
      } else if (!fileEntity.canAccess(user)) {
        throw new UnauthorizedError('User not authorized to access file.');
      }

      req.fileEntity = fileEntity;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const downloadFile: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { unsafe } = req.query;
    const fileEntity = req.fileEntity;
    if (unsafe !== 'true' && !fileEntity.scanned) {
      throw new InvalidOperationError('File scan pending.');
    }

    const stream = await fileEntity.readFile(user);
    res.writeHead(200, null, {
      'Content-Disposition': `attachment; filename="${fileEntity.filename}"`,
      'Cache-Control': fileEntity.type.anonymousRead ? 'public' : 'no-store',
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

export function deleteFile(logger: Logger, eventService: EventService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const fileEntity = req.fileEntity;
      await fileEntity.markForDeletion(user);

      logger.info(
        `File '${fileEntity.filename}' (ID: ${fileEntity.id}) marked for deletion by ` +
          `user '${user.name}' (ID: ${user.id}).`,
        {
          context: 'file-router',
          tenant: user?.tenantId?.toString(),
          user: `${user.name} (ID: ${user.id})`,
        }
      );

      res.send({ deleted: fileEntity.deleted });

      eventService.send(
        fileDeleted(user, {
          id: fileEntity.id,
          filename: fileEntity.filename,
          size: fileEntity.size,
          recordId: fileEntity.recordId,
          created: fileEntity.created,
          lastAccessed: fileEntity.lastAccessed,
          createdBy: fileEntity.createdBy,
        })
      );
    } catch (err) {
      next(err);
    }
  };
}

export const createFileRouter = ({
  logger,
  storageProvider,
  fileRepository,
  eventService,
}: FileRouterProps): Router => {
  const upload = createUpload({ storageProvider, fileRepository });
  const fileRouter = Router();

  fileRouter.get('/types', assertAuthenticatedHandler, getTypes);
  fileRouter.get('/types/:fileTypeId', assertAuthenticatedHandler, getType(logger));

  fileRouter.get('/files', assertAuthenticatedHandler, getFiles(fileRepository));
  fileRouter.post('/files', assertAuthenticatedHandler, upload.single('file'), uploadFile(logger, eventService));

  fileRouter.delete(
    '/files/:fileId',
    assertAuthenticatedHandler,
    getFile(fileRepository),
    deleteFile(logger, eventService)
  );
  fileRouter.get('/files/:fileId', getFile(fileRepository), (req, res) => res.send(mapFile(req.fileEntity)));
  fileRouter.get('/files/:fileId/download', getFile(fileRepository), downloadFile);

  return fileRouter;
};
