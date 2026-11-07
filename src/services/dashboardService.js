import { listDashboardRecords, removeDashboardDemoPurchases } from '../repositories/dashboardRepository';
import { buildDashboard, getDashboardFilters } from '../domain/dashboardAnalytics';

export async function loadDashboard(accountId) {
  await removeDashboardDemoPurchases(accountId);
  const { purchases } = await listDashboardRecords(accountId);
  return { records: purchases, filters: getDashboardFilters(purchases) };
}

export { removeDashboardDemoPurchases };

export { buildDashboard };
