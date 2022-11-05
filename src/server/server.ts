import fs from 'fs';
import https from 'https';
import http from 'http';
import express from 'express';
import morgan from 'morgan';
import methodOverride from 'method-override';
import { Sequelize, Error } from 'sequelize';
import { PORT } from 'src/config/app';
import { DB_USERNAME, DB_PASSWORD, DB_HOSTNAME, DB_PORT, DB_NAME } from 'src/config/db';
import { initializeModels } from 'src/models';
import { configureResponseHandlers } from './utils';

// Extend the types availble on the Express request/response objects.
declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace Express {
    interface Response {
      fatalError: (message: string | Error) => Response | undefined;
      validationError: (message: string) => Response | undefined;
      notFoundError: (message: string) => Response | undefined;
      authenticationError: (message: string) => Response | undefined;
      authorizationError: (message: string) => Response | undefined;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      success: (message: string, data?: any) => Response | undefined;
    }
  }
}

const sequelize = new Sequelize(
  `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOSTNAME}:${DB_PORT}/${DB_NAME}`,
  {
    logging: false,
  },
);

initializeModels(sequelize).then(() => {
  const app = express();
  app.use(
    express.urlencoded({
      extended: true,
    }),
  );
  app.use(express.json());
  app.use(methodOverride());
  app.use(morgan('dev'));

  // Setup custom response handlers for the app.
  app.use((_req, res, next) => {
    configureResponseHandlers(res);
    next();
  });

  // Build an HTTP or HTTPS server depending on configs available.
  let server;
  const certExists = fs.existsSync('../config/ssl/cert.pem');
  const keyExists = fs.existsSync('../config/ssl/key.pem');
  const useHttps = certExists && keyExists;
  if (useHttps) {
    server = https.createServer(
      {
        key: fs.readFileSync('../config/ssl/key.pem'),
        cert: fs.readFileSync('../config/ssl/cert.pem'),
      },
      app,
    );
  } else {
    server = http.createServer(app);
  }

  server.listen(PORT, () => {
    console.log(
      'Typhoon API listening on port %s using %s protocol',
      PORT,
      useHttps ? 'https' : 'http',
    );
  });
});