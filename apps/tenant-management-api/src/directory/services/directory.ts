import { logger } from '../../middleware/logger';
import { ApiError } from '../../util/apiError';
import * as HttpStatusCodes from 'http-status-codes';
import { validateUrn, validateVersion, validatePath } from './util/patternUtil';
import { AdspId } from '@abgov/adsp-service-sdk';
import { DirectoryRepository } from '../repository';
import { MongoDirectoryRepository } from '../mongo/directory';

interface ServiceProps {
  directoryRepository: DirectoryRepository;
}

export interface URNComponent {
  scheme?: string;
  nic?: string;
  core?: string;
  service?: string;
  apiVersion?: string;
  resource?: string;
}
export interface Response {
  url?: string;
  urn?: string;
}
const URN_SEPARATOR = ':';

const getUrn = (component: URNComponent) => {
  let urn = `${component.scheme}:${component.nic}:${component.core}:${component.service}`;
  urn = component.apiVersion ? `${urn}:${component.apiVersion}` : urn;
  urn = component.resource ? `${urn}:${component.resource}` : urn;
  return urn;
};

const getUrlResponse = (services, component) => {
  let host = null;
  if (services) {
    for (const service of services) {
      if (service['service'] === component.service) {
        host = service['host'];
        break;
      }
    }
  }

  //construct returned url
  if (host) {
    const discoveryRes: Response = {};
    discoveryRes.urn = getUrn(component);

    let responseUrl = component.apiVersion ? `${host}/application/${component.apiVersion}` : `${host}`;

    responseUrl = component.resource ? `${responseUrl}${component.resource}` : responseUrl;
    discoveryRes.url = responseUrl;
    return discoveryRes;
  }
  return new ApiError(
    HttpStatusCodes.BAD_GATEWAY,
    'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
  );
};

export const discovery = async (urn: string, { directoryRepository }: ServiceProps): Promise<Response | ApiError> => {
  //resolve the urn to object
  logger.info(`Starting discover URL for urn ${urn}`);
  const component: URNComponent = {};
  const urnArray = urn.toLowerCase().split(URN_SEPARATOR);
  if (urnArray.length > 3) {
    component.scheme = urnArray[0];
    component.nic = urnArray[1];
    component.core = urnArray[2];
    component.service = urnArray[3];

    if (!validateUrn(getUrn(component))) {
      return new ApiError(
        HttpStatusCodes.BAD_REQUEST,
        'Please give right format URN! urn format should looks like urn:ads:{tenant|core}:{service}'
      );
    }

    if (urnArray[4]) {
      if (validateVersion(urnArray[4])) {
        component.apiVersion = urnArray[4];
        if (urnArray[5] && validatePath(urnArray[5])) {
          component.resource = urnArray[5];
        }
      }

      if (validatePath(urnArray[4])) {
        component.resource = urnArray[4];
      }
    }

    try {
      const directory = await directoryRepository.find(1, null, null);

      if (!directory || directory.results.length === 0) {
        // No directory in mongo db will read from json file.
        logger.error(
          'There is no record in directory DB, Please insert data by calling  "nx run tools-scripts:execute --script=loadDirectoryData"'
        );
      }

      // get url from mongo
      const result = await directoryRepository.find(1, null, { name: { $regex: component.core, $options: 'i' } });

      const services = result.results[0]['services'];
      return getUrlResponse(services, component);
    } catch (err) {
      return new ApiError(
        HttpStatusCodes.BAD_REQUEST,
        'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
      );
    }
  }

  return new ApiError(
    HttpStatusCodes.BAD_REQUEST,
    'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
  );
};

export const getDirectories = async (): Promise<Response[] | ApiError> => {
  logger.info('Starting get directory from mongo db...');
  try {
    const response = [];
    const directoryRepository: DirectoryRepository = new MongoDirectoryRepository();
    const result = await directoryRepository.find(100, null, null);
    const directories = result.results;
    if (directories && directories.length > 0) {
      for (const directory of directories) {
        const services = directory['services'];
        for (const service of services) {
          const element: Response = {};
          const component: URNComponent = {
            scheme: 'urn',
            nic: 'ads',
            core: directory['name'],
            service: service['service'],
          };

          element.urn = getUrn(component);
          const serviceName: string = service['host'].toString();
          element.url = serviceName;
          response.push(element);
        }
      }
    }
    return response;
  } catch (err) {
    return new ApiError(
      HttpStatusCodes.BAD_REQUEST,
      'Empty in urn! urn format should looks like urn:ads:{tenant|core}:{service}'
    );
  }
};

export const getServiceUrl = async (id: AdspId): Promise<URL> => {
  const directory = (await getDirectories()) as { urn: string; url: string }[];
  const entry = directory.find((entry) => entry.urn === `${id}`);
  if (!entry) {
    throw new Error(`Directory entry for ${id} not found.`);
  }
  return new URL(entry.url);
};
