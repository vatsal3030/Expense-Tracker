import { createMicroservice } from './base.service';
import { groupRouter } from '../routes/group.routes';
import { expenseRouter } from '../routes/expense.routes';
import { budgetRouter } from '../routes/budget.routes';
import { recurringRouter } from '../routes/recurring.routes';
import { fxRouter } from '../routes/fx.routes';

// =============================================================================
// EXPENSE & CORE DOMAIN MICROSERVICE
// Handles: Groups, Expenses, Splits, Budgets, Recurring Expenses, FX Conversion
// =============================================================================
export const expenseService = createMicroservice({
  serviceName: 'expense-service',
  defaultPort: 5002,
  routes: [
    { path: '/api/groups', router: groupRouter },
    { path: '/api/expenses', router: expenseRouter },
    { path: '/api/budgets', router: budgetRouter },
    { path: '/api/recurring', router: recurringRouter },
    { path: '/api/fx', router: fxRouter },
  ],
});
