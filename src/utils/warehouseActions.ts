import type { WarehouseAssignments, WarehouseItem } from './warehouse';
import { warehouseItemKey } from './warehouse';

export const upsertWarehouseShelfItem = (
  assignments: WarehouseAssignments,
  shelf: string,
  item: WarehouseItem,
  editTarget?: { shelf: string; index: number } | null
): { next: WarehouseAssignments; duplicated: boolean } => {
  const current = assignments[shelf] || [];

  if (editTarget && editTarget.shelf === shelf) {
    const nextItems = current.map((x, i) => (i !== editTarget.index ? x : item));
    return { next: { ...assignments, [shelf]: nextItems }, duplicated: false };
  }

  const key = warehouseItemKey(item);
  const exists = current.some((x) => warehouseItemKey(x) === key);
  if (exists) return { next: assignments, duplicated: true };

  return {
    next: {
      ...assignments,
      [shelf]: [...current, item],
    },
    duplicated: false,
  };
};

export const removeWarehouseShelfItem = (
  assignments: WarehouseAssignments,
  shelf: string,
  index: number
): WarehouseAssignments => {
  const current = assignments[shelf] || [];
  const nextItems = current.filter((_, i) => i !== index);
  const next = { ...assignments };
  if (nextItems.length === 0) delete next[shelf];
  else next[shelf] = nextItems;
  return next;
};

export const mergeWarehouseUpdates = (
  assignments: WarehouseAssignments,
  updates: WarehouseAssignments
): WarehouseAssignments => {
  const next: WarehouseAssignments = { ...assignments };

  Object.entries(updates).forEach(([shelf, items]) => {
    const existing = next[shelf] || [];
    const existingKeys = new Set(existing.map((x) => warehouseItemKey(x)));
    const toAdd = items.filter((x) => {
      const k = warehouseItemKey(x);
      if (existingKeys.has(k)) return false;
      existingKeys.add(k);
      return true;
    });
    next[shelf] = [...existing, ...toAdd];
  });

  return next;
};
