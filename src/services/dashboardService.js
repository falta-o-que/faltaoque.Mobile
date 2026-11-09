import { listDashboardRecords } from '../repositories/dashboardRepository';
import { buildDashboard, getDashboardFilters } from '../domain/dashboardAnalytics';

export async function loadDashboard(accountId, pantryId) {
  const { purchases } = await listDashboardRecords(accountId, pantryId);
  return { records: purchases, filters: getDashboardFilters(purchases) };
}

export { buildDashboard };
