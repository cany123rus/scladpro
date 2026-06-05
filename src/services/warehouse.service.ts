import { supabase } from '../lib/supabase';
import { parseWarehouseAssignments, WarehouseAssignments } from '../utils/warehouse';

const WAREHOUSE_SETTINGS_KEY = 'warehouse_shelves_v1';

export const loadWarehouseAssignmentsFromDb = async (): Promise<WarehouseAssignments> => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', WAREHOUSE_SETTINGS_KEY)
    .limit(1);

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  if (row?.value == null) return {};

  return parseWarehouseAssignments(row.value);
};

export const persistWarehouseAssignmentsToDb = async (assignments: WarehouseAssignments) => {
  const raw = JSON.stringify(assignments);

  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: WAREHOUSE_SETTINGS_KEY, value: raw }, { onConflict: 'key' });

  if (error) throw error;

  localStorage.setItem(WAREHOUSE_SETTINGS_KEY, raw);
};
