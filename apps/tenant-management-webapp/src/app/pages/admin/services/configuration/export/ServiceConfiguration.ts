/**
 * Functions used to convert the raw configuration data received from the
 * GET /configuration/... API calls
 * into something easier to use by the import/Export tab.
 */
import { ServiceSchemas, SchemaType, Service } from '@store/configuration/model';

export interface SchemaRevision {
  schema: SchemaType;
  revision: number;
}

export const toNamespaceMap = (...revisions: ServiceSchemas[]): Record<Service, string[]> => {
  const results: Record<Service, string[]>[] = [];
  for (const revision of revisions) {
    const namespaces = revision ? toNamespaces(revision) : {};
    if (namespaces) {
      results.push(namespaces);
    }
  }
  return merge(results);
};

export const toSchemaMap = (...revisions: ServiceSchemas[]): Record<Service, SchemaRevision> => {
  const results: Record<Service, SchemaRevision>[] = [];
  for (const revision of revisions) {
    const schemas = revision ? toSchema(revision) : {};
    if (schemas) {
      results.push(schemas);
    }
  }
  return merge(results);
};

export const toService = (namespace: string, name: string): Service => {
  return `${namespace}:${name}`;
};

export type serviceExports = Record<Service, SchemaRevision>;
export type namespaceExports = Record<Service, serviceExports>;

export const toDownloadFormat = (exports: Record<Service, SchemaRevision>): namespaceExports => {
  const results: namespaceExports = {};
  for (const key in exports) {
    const namespace = toNamespace(key);
    const service = toServiceName(key);
    if (results[namespace]) {
      results[namespace][service] = exports[key];
    } else {
      results[namespace] = { [service]: exports[key] };
    }
  }
  return results;
};

// return a map of namespace => names
const toNamespaces = (revisions: ServiceSchemas): Record<Service, string[]> => {
  return Object.keys(revisions.configuration)
    .sort()
    .reduce((nsMap: Record<Service, string[]>, key: Service) => {
      const nameSpace = toNamespace(key);
      const name = toServiceName(key);
      if (nsMap[nameSpace]) {
        nsMap[nameSpace].push(name);
      } else {
        nsMap[nameSpace] = [name];
      }
      return nsMap;
    }, {});
};

// return a map of namespace:name to {schema, revision}
const toSchema = (revisions: ServiceSchemas): Record<Service, SchemaRevision> => {
  if (revisions && revisions.revision !== undefined && revisions.revision !== null) {
    return Object.keys(revisions.configuration)
      .sort()
      .reduce((schemaMap: Record<Service, SchemaRevision>, key: Service) => {
        schemaMap[key] = {
          schema: revisions.configuration[key],
          revision: revisions.revision,
        };
        return schemaMap;
      }, {});
  }
  return {};
};

const merge = <T>(records: Record<Service, T>[]): Record<Service, T> => {
  const result: Record<Service, T> = {};
  for (const record of records) {
    for (const key in record) {
      result[key] = record[key];
    }
  }
  return result;
};

const toNamespace = (key: Service): string => {
  return key.split(':')[0];
};

const toServiceName = (key: Service): string => {
  return key.split(':')[1];
};
