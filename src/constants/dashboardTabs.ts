export const DASHBOARD_TAB_IDS = [
  'tasks',
  'warehouse',
  'cameras',
  'map',
  'products',
  'wb_products',
  'fbs',
  'supplies',
  'orders',
  'reception',
  'suppliers',
  'honest_sign',
  'completed',
  'trash',
  'reports',
  'analytics',
  'advertising',
  'instagram',
  'barters',
  'telegram',
  'employees',
  'database',
] as const;

export type DashboardTabId = typeof DASHBOARD_TAB_IDS[number];

export const DEFAULT_DASHBOARD_TAB: DashboardTabId = 'tasks';

export const isDashboardTabId = (value: string | null | undefined): value is DashboardTabId =>
  Boolean(value && DASHBOARD_TAB_IDS.includes(value as DashboardTabId));
