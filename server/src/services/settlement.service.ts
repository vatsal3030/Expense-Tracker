import { createMicroservice } from './base.service';
import { settlementRouter } from '../routes/settlement.routes';
import { dashboardRouter } from '../routes/dashboard.routes';
import { exportRouter } from '../routes/export.routes';

// =============================================================================
// SETTLEMENT & OPTIMIZATION GRAPH ENGINE MICROSERVICE
// Handles: Greedy Min-Cash Flow DAG Algorithm, Settlements, Dashboard Analytics, Statement Exports
// =============================================================================
export const settlementService = createMicroservice({
  serviceName: 'settlement-service',
  defaultPort: 5003,
  routes: [
    { path: '/api/settlements', router: settlementRouter },
    { path: '/api/dashboard', router: dashboardRouter },
    { path: '/api/export', router: exportRouter },
  ],
});
