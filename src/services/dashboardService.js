import { listDashboardRecords, replacePurchasesWithDashboardDemo } from '../repositories/dashboardRepository';
import { buildDashboard, getDashboardFilters } from '../domain/dashboardAnalytics';

export async function loadDashboard(accountId) {
  const { purchases } = await listDashboardRecords(accountId);
  return { records: purchases, filters: getDashboardFilters(purchases) };
}

export { replacePurchasesWithDashboardDemo };

export { buildDashboard };
