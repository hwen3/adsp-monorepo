import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();
export const POD_TYPES = {
  api: 'api',
  job: 'job',
};

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access-dev.os99.gov.ab.ca' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'status' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    MONGO_TLS: envalid.bool({ default: false }),
    PORT: envalid.num({ default: 3338 }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:status-service' }),
    CLIENT_SECRET: envalid.str({ default: '' }),
    AMQP_HOST: envalid.str({ default: 'localhost' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3333' }),
    TENANT_MANAGEMENT_API_HOST: envalid.str({ default: 'http://localhost:3333' }),
    PLATFORM_TENANT_REALM: envalid.str({ default: '0014430f-abb9-4b57-915c-de9f3c889696' }),
    HA_MODEL: envalid.str({ default: 'false' }),
    POD_TYPE: envalid.str({ default: POD_TYPES.api }), // FOR HA_MODEL = true only.
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);

environment.isProd; // true if NODE_ENV === 'production'
