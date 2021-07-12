module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Notification Service',
    version: '0.0.0',
    description:
      'The notification service provides the capability to define notification types and manage subscriptions. ' +
      'Consumers are registered with their own space (tenant) containing notification types that include ' +
      'role based access policy, trigger events, template and channel configuration, and associated subscriptions/subscribers.',
  },
  tags: [
    {
      name: 'Subscription',
      description: 'API to managed subscribers and subscriptions.',
    },
  ],
  components: {
    securitySchemes: {
      accessToken: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ accessToken: [] }],
};
