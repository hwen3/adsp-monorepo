import { AdspId, assertAdspId, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { property } from 'lodash';
import { Resource, ResourceTypeConfiguration } from '../types';
import axios from 'axios';
import { Logger } from 'winston';
import { DirectoryRepository } from '../repository';

export class ResourceType {
  public type: string;
  private matcher: RegExp;
  private nameGetter: (value: unknown) => string;
  private descriptionGetter: (value: unknown) => string;

  constructor(
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    private repository: DirectoryRepository,
    { type, matcher, namePath, descriptionPath }: ResourceTypeConfiguration
  ) {
    this.type = type;
    this.matcher = new RegExp(matcher);
    this.nameGetter = property(namePath);
    this.descriptionGetter = descriptionPath ? property(descriptionPath) : () => undefined;
  }

  public matches(urn: AdspId): boolean {
    assertAdspId(urn, null, 'resource');
    return this.matcher.test(urn.resource);
  }

  public async resolve(resource: Resource): Promise<Resource> {
    if (!this.matches(resource?.urn)) {
      throw new InvalidOperationError(`Resource type '${this.type}' not matched to resource: ${resource.urn}`);
    }

    try {
      const resourceUrl = await this.directory.getResourceUrl(resource.urn);
      if (!resourceUrl) {
        throw new NotFoundError(`Failed to lookup URL for resource: ${resource.urn}.`);
      }

      const token = await this.tokenProvider.getAccessToken();

      this.logger.debug(`Retrieving resource ${resource.urn} from: ${resourceUrl}...`, {
        context: 'ResourceType',
        tenant: resource.tenantId?.toString(),
      });

      const { data } = await axios.get(resourceUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tenantId: resource.tenantId?.toString() },
      });

      this.logger.debug(`Retrieved resource ${resource.urn} and resolving name and description...`, {
        context: 'ResourceType',
        tenant: resource.tenantId?.toString(),
      });

      const name = this.nameGetter(data) || resource.name;
      const description = this.descriptionGetter(data) || resource.description;

      return await this.repository.saveResource({ ...resource, name, description, type: this.type });
    } catch (err) {
      this.logger.warn(`Error encountered resolving resource ${resource.urn}: ${err}`, {
        context: 'ResourceType',
        tenant: resource.tenantId?.toString(),
      });

      throw err;
    }
  }
}