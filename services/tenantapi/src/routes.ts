import * as Express from 'express';
import { Controllers } from './controllers/index.js';
import * as Interventions from './controllers/interventions.js';
import { Middlewares } from '@microrealestate/common';

import { getPublicProperties } from './controllers/public.js'


const routes = Express.Router();


// DEBUG - Afficher les routes enregistrées
console.log('=== REGISTERING ROUTES ===');
console.log('POST /interventions');
console.log('GET /interventions');


// --- route publique ---
routes.get('/tenantapi/public/properties', getPublicProperties);
routes.get('/tenantapi/public/properties', getPublicProperties);
routes.get('/properties', getPublicProperties);

// Routes tenants existantes
routes.get('/tenants', Middlewares.asyncWrapper(Controllers.getAllTenants));
routes.get(
  '/tenant/:tenantId',
  Middlewares.asyncWrapper(Controllers.getOneTenant)
);

// Routes interventions - Import direct
routes.post(
  '/interventions',
  Middlewares.asyncWrapper(Interventions.createIntervention)
);
routes.get(
  '/interventions',
  Middlewares.asyncWrapper(Interventions.getInterventions)
);
routes.get(
  '/interventions/:interventionId',
  Middlewares.asyncWrapper(Interventions.getIntervention)
);
routes.post(
  '/interventions/:interventionId/comments',
  Middlewares.asyncWrapper(Interventions.addComment)
);

export default routes;
