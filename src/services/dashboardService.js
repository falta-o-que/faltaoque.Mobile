import { listDashboardRecords, removeDashboardDemoPurchases } from '../repositories/dashboardRepository';
import { buildDashboard, getDashboardFilters } from '../domain/dashboardAnalytics';

export async function loadDashboard(accountId, pantryId) {
  await removeDashboardDemoPurchases(accountId);
  const { purchases } = await listDashboardRecords(accountId, pantryId);
  return { records: purchases, filters: getDashboardFilters(purchases) };
}

export { removeDashboardDemoPurchases };

export { buildDashboard };
