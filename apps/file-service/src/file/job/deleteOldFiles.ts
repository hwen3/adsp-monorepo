import { AdspId, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { EventService, TenantService, ConfigurationService } from '@abgov/adsp-service-sdk';
import { ServiceConfiguration } from '../configuration';
import { fileDeleted } from '../events';

import { jobUser } from './user';

interface DeleteJobProps {
  tokenProvider: TokenProvider;
  serviceId: AdspId;
  logger: Logger;
  fileRepository: FileRepository;
  eventService: EventService;
  tenantService: TenantService;
  configurationService: ConfigurationService;
}

export function getBeforeLastAccessed(retention: number) {
  const now = new Date();
  // last night
  now.setHours(0, 0, 0, 0);
  const beforeDate = new Date(now.setDate(now.getDate() - retention));
  return beforeDate.toISOString();
}

export function createDeleteOldFilesJob({
  serviceId,
  logger,
  fileRepository,
  configurationService,
  tenantService,
  tokenProvider,
  eventService,
}: DeleteJobProps) {
  return async (): Promise<void> => {
    try {
      logger.debug('Starting delete job...');

      const tenants = await tenantService.getTenants();
      const token = await tokenProvider.getAccessToken();

      let numberDeleted = 0;

      await Promise.all(
        tenants.map(async (tenant) => {
          const configuration = await configurationService.getConfiguration<ServiceConfiguration, ServiceConfiguration>(
            serviceId,
            token,
            tenant.id
          );

          return await Promise.all(
            Object.keys(configuration).map(async (key) => {
              if (configuration[key].rules?.retention?.active) {
                const retention = configuration[key].rules?.retention?.deleteInDays;
                let after = null;

                do {
                  const { results, page } = await fileRepository.find(tenant.id, 20, after as string, {
                    lastAccessedBefore: getBeforeLastAccessed(retention),
                  });

                  for (const file of results) {
                    if (!file.deleted) {
                      try {
                        jobUser.tenantId = file.tenantId;
                        const deleted = await file.markForDeletion(jobUser);
                        if (deleted) {
                          deleted.retentionDays = retention;
                          numberDeleted++;
                          eventService.send(
                            fileDeleted(jobUser, {
                              id: deleted.id,
                              filename: deleted.filename,
                              size: deleted.size,
                              recordId: deleted.recordId,
                              created: deleted.created,
                              lastAccessed: deleted.lastAccessed,
                              createdBy: deleted.createdBy,
                              retentionDays: deleted.retentionDays,
                            })
                          );
                        }
                      } catch (err) {
                        logger.error(`Error deleting file with ID: ${file.id}. ${err}`);
                      }
                    }
                  }

                  after = page.next;
                } while (after);
              }
            })
          );
        })
      );

      logger.info(`Completed file delete job and deleted ${numberDeleted} files.`);
    } catch (err) {
      logger.error(`Error encountered in file deleting job. ${err}`);
    }
  };
}
