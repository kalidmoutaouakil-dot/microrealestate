import * as Express from 'express';
import {
  EnvironmentConfig,
  logger,
  Middlewares,
  Service
} from '@microrealestate/common';
import routes from './routes.js';
import { getPublicProperties } from './controllers/public.js';

Main();

async function onStartUp(application: Express.Application) {
  // --- Route publique AVANT toute protection ---
  application.get('/api/public/properties', getPublicProperties);

  // --- Middleware protégé pour le reste ---
  application.use(
    Middlewares.needAccessToken(
      Service.getInstance().envConfig.getValues().ACCESS_TOKEN_SECRET
    ),
    Middlewares.checkOrganization(),
    Middlewares.onlyTypes(['user']),
  );

  application.use('/tenantapi', routes);
}

async function Main() {
  let service;
  try {
    service = Service.getInstance(
      new EnvironmentConfig({
        DEMO_MODE: process.env.DEMO_MODE
          ? process.env.DEMO_MODE.toLowerCase() === 'true'
          : undefined
      })
    );

    await service.init({
      name: 'tenantapi',
      useRequestParsers: true,
      useMongo: true,
      onStartUp
    });

    await service.startUp();
  } catch (error) {
    logger.error(String(error));
    service?.shutDown(-1);
  }
}
