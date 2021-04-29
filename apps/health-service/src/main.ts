import * as express from 'express';
import * as passport from 'passport';
import { Strategy as AnonymousStrategy } from 'passport-anonymous';
import * as compression from 'compression';
import * as helmet from 'helmet';
import {
  createLogger,
  createKeycloakStrategy,
  UnauthorizedError,
  NotFoundError,
  InvalidOperationError,
} from '@core-services/core-common';
import { environment } from './environments/environment';
import { createRepositories } from './mongo';
import { applyEndpoints } from './app';
import * as cors from 'cors';

const logger = createLogger('health-service', environment?.LOG_LEVEL || 'info');
const app = express();

app.use(compression());
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cors());

passport.use('jwt', createKeycloakStrategy());
passport.use(new AnonymousStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.use(passport.initialize());
app.use('/health', passport.authenticate(['jwt', 'anonymous'], { session: false }));

(async () => {
  const createRepoJob = createRepositories({ ...environment, logger });
  const [repositories] = [await createRepoJob];

  // service endpoints
  applyEndpoints(app, { logger, ...repositories });

  // non-service endpoints
  app.get('/health', (_req, res) =>
    res.json({
      db: repositories.isConnected(),
    })
  );

  // error handler
  app.use((err, _req, res, _next) => {
    if (err instanceof UnauthorizedError) {
      res.status(401).send(err.message);
    } else if (err instanceof NotFoundError) {
      res.status(404).send(err.message);
    } else if (err instanceof InvalidOperationError) {
      res.status(400).send(err.message);
    } else {
      logger.warn(`Unexpected error encountered in handler: ${err}`);
      res.sendStatus(500);
    }
  });

  // start service
  const port = environment.PORT || 3338;
  const server = app.listen(port, () => {
    logger.info(`Listening at http://localhost:${port}`);
  });
  server.on('error', (err) => logger.error(`Error encountered in server: ${err}`));
})();
