import { AdspId, EventService, adspId } from '@abgov/adsp-service-sdk';
import { Application } from 'express';
import { Logger } from 'winston';
import { FileService } from '../file';
import { NotificationService } from '../notification';
import { scheduleFormJobs } from './jobs';
import { FormSubmissionRepository, Repositories } from './repository';
import { createFormRouter } from './router';
import { QueueTaskService } from '../task';
import { CommentService } from './comment';
import { PdfService } from './pdf';

export * from './roles';
export * from './comment';
export * from './configuration';
export * from './model';
export * from './types';
export * from './repository';
export * from './events';
export * from './notifications';
export * from './pdf';

interface FormMiddlewareProps extends Repositories {
  serviceId: AdspId;
  logger: Logger;
  eventService: EventService;
  notificationService: NotificationService;
  fileService: FileService;
  commentService: CommentService;
  queueTaskService: QueueTaskService;
  formSubmissionRepository: FormSubmissionRepository;
  pdfService: PdfService;
}

export const applyFormMiddleware = (
  app: Application,
  {
    serviceId,
    logger,
    formRepository: repository,
    eventService,
    notificationService,
    fileService,
    commentService,
    queueTaskService,
    formSubmissionRepository: submissionRepository,
    pdfService,
  }: FormMiddlewareProps
): Application => {
  const apiId = adspId`${serviceId}:v1`;
  scheduleFormJobs({ apiId, logger, repository, eventService, fileService, notificationService });

  const router = createFormRouter({
    apiId,
    repository,
    eventService,
    queueTaskService,
    notificationService,
    fileService,
    commentService,
    submissionRepository,
    pdfService,
  });
  app.use('/form/v1', router);

  return app;
};
