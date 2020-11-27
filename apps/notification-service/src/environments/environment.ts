const env = process.env;

export const environment = {
  KEYCLOAK_ROOT_URL: '',
  KEYCLOAK_REALM: '',
  KEYCLOAK_CLIENT_ID: '',
  KEYCLOAK_CLIENT_SECRET: '',
  LOG_LEVEL: 'debug',
  MONGO_URI: 'mongodb://localhost:27017',
  MONGO_DB: 'notification',
  MONGO_USER: null,
  MONGO_PASSWORD: null,
  AMQP_HOST: 'localhost',
  AMQP_USER: 'guest',
  AMQP_PASSWORD: 'guest',
  SMTP_HOST: 'smtp.mailtrap.io',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  NOTIFY_URL: '',
  NOTIFY_API_KEY: '',
  NOTIFY_TEMPLATE_ID: '',
  EVENT_SERVICE_URL: 'http://localhost:3334',
  PORT: 3335,
  ...env,
  production: env.NODE_ENV === 'production'
};
