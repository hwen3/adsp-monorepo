import { AdspId } from '@abgov/adsp-service-sdk';
import { Results } from '@core-services/core-common';
import { DirectoryEntity } from '../model';
import { Directory, Criteria, Tag, Resource, TagCriteria } from '../types';

export interface DirectoryRepository {
  find(top: number, after: string, criteria: Criteria): Promise<Results<DirectoryEntity>>;
  getDirectories(name: string): Promise<DirectoryEntity>;
  exists(name: string): Promise<boolean>;
  update(directory: Directory): Promise<boolean>;
  save(type: DirectoryEntity): Promise<DirectoryEntity>;

  getTags(top: number, after: string, criteria: TagCriteria): Promise<Results<Tag>>;
  getTaggedResources(tenantId: AdspId, tag: string, top: number, after: string): Promise<Results<Resource>>;

  applyTag(tag: Tag, resource: Resource): Promise<{ tag: Tag; resource: Resource; tagged: boolean }>;
  removeTag(tag: Tag, resource: Resource): Promise<{ tag?: Tag; resource?: Resource; untagged: boolean }>;
}
