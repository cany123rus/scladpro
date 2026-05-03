export type WarehouseItem = { article: string; size: string; color: string; supplier?: string };
export type WarehouseAssignments = Record<string, WarehouseItem[]>;

export const warehouseItemKey = (item: Partial<WarehouseItem>) =>
  `${String(item.article || '').trim()}|${String(item.size || '').trim()}|${String(item.color || '').trim()}|${String(item.supplier || '').trim()}`.toLowerCase();

export const parseWarehouseAssignments = (input: unknown): WarehouseAssignments => {
  const source = typeof input === 'string'
    ? (() => {
        try {
          return JSON.parse(input);
        } catch {
          return null;
        }
      })()
    : input;

  if (!source || typeof source !== 'object') return {};

  const normalized: WarehouseAssignments = {};
  Object.entries(source as Record<string, any>).forEach(([shelf, rawItem]) => {
    if (Array.isArray(rawItem)) {
      normalized[shelf] = rawItem
        .map((x: any) => ({
          article: String(x?.article || '').trim(),
          size: String(x?.size || '').trim(),
          color: String(x?.color || '').trim(),
          supplier: String(x?.supplier || '').trim(),
        }))
        .filter((x) => x.article);
    } else if (rawItem && typeof rawItem === 'object') {
      normalized[shelf] = [
        {
          article: String((rawItem as any).article || '').trim(),
          size: String((rawItem as any).size || '').trim(),
          color: String((rawItem as any).color || '').trim(),
          supplier: String((rawItem as any).supplier || '').trim(),
        },
      ].filter((x) => x.article);
    }
  });

  return normalized;
};
