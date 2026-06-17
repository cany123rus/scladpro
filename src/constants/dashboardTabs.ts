export const DASHBOARD_TAB_IDS = [
  'tasks',
  'warehouse',
  'cameras',
  'map',
  'wb_products',
  'fbs',
  'supplies',
  'orders',
  'reception',
  'suppliers',
  'honest_sign',
  'completed',
  'reports',
  'analytics',
  'advertising',
  'barters',
  'employees',
  'database',
  'admin',
  'instruction',
] as const;

export type DashboardTabId = typeof DASHBOARD_TAB_IDS[number];

export const DEFAULT_DASHBOARD_TAB: DashboardTabId = 'tasks';

export const isDashboardTabId = (value: string | null | undefined): value is DashboardTabId =>
  Boolean(value && DASHBOARD_TAB_IDS.includes(value as DashboardTabId));
