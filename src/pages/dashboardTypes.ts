// Types extracted from Dashboard.tsx (pure type declarations, no runtime).

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export type NotificationItem = {
  id: string;
  message: string;
  type: NotificationType;
  time: Date;
};

export type ToastStyle = { bar: string; iconWrap: string; ring: string; title: string };

export interface Supplier {
  id: string;
  name: string;
  telegram_chat_id: string;
  wb_api_token?: string;
  created_at: string;
}

export interface Product {
  id: string;
  supplier_id: string;
  name: string;
  wb_sku: string;
  barcode: string;
  size: string;
  color: string;
  created_at: string;
  photo_url?: string;
  model_number?: string;
  vendor_code?: string;
  nm_id?: string;
}

export interface FboPalletSession {
  id: string;
  supplier_id: string;
  status: 'active' | 'closed';
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface FboPallet {
  id: string;
  session_id: string;
  supplier_id: string;
  warehouse_id?: string | null;
  supply_id?: string | null;
  pallet_number: number;
  created_at: string;
  deleted_at?: string | null;
}

export interface FboPalletWarehouse {
  id: string;
  supplier_id: string;
  name: string;
  created_at: string;
  deleted_at?: string | null;
}

export interface FboPalletSupply {
  id: string;
  supplier_id: string;
  warehouse_id: string;
  name: string;
  date?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface FboPalletItem {
  id: string;
  pallet_id: string;
  supplier_id: string;
  product_id?: string | null;
  nm_id?: string | null;
  barcode?: string | null;
  vendor_code?: string | null;
  title: string;
  size?: string | null;
  color?: string | null;
  photo_url?: string | null;
  qty: number;
  product_json?: any;
  created_at: string;
  deleted_at?: string | null;
}

export interface FboPalletProductOption {
  key: string;
  nm_id: string;
  barcode: string;
  vendor_code: string;
  title: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  photo_url: string;
  product_json: any;
}

export interface FboPalletHint {
  warehouse_name?: string | null;
  supply_name?: string | null;
  supply_date?: string | null;
  pallet_number: number;
  item_title: string;
  item_size?: string | null;
  item_color?: string | null;
  target_qty?: number;
  scanned_qty?: number;
}

export interface FboPalletSnapshot {
  sessions: FboPalletSession[];
  warehouses: FboPalletWarehouse[];
  supplies: FboPalletSupply[];
  pallets: FboPallet[];
  items: FboPalletItem[];
}

export interface Supply {
  id: string;
  supplier_id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at?: string;
  total_items?: number;
}

export interface SupplyBox {
  id: string;
  supply_id: string;
  name: string;
  created_at: string;
  total_items?: number;
}

export interface SupplyItem {
  id: string;
  box_id: string;
  product_id: string;
  honest_sign_code: string;
  created_at: string;
  product?: Product;
}

export interface OfflineFboSession {
  supply_id: string;
  supplier_id: string;
  supply_name: string;
  boxes: SupplyBox[];
  items: SupplyItem[];
  updated_at: string;
  base_box_number: number;
}

export interface OfflineFboValidationSummary {
  checkedAt: string;
  boxesCount: number;
  itemsCount: number;
  duplicateLocal: Array<{ code: string; boxNames: string[] }>;
  duplicateDb: Array<{ code: string; boxName: string; supplyName: string }>;
  missingProducts: Array<{ label: string; boxName: string }>;
  ok: boolean;
  message: string;
}

export type ExternalAdsSocialLink = {
  url: string;
  followers: string;
  platform?: string;
};

export type ExternalAdsHistoryItem = {
  id: string;
  kind: 'barter' | 'ad';
  supplier_id: string;
  supplier_name: string;
  product_id: string;
  product_name: string;
  month: string;
  url: string;
  normalizedUrl: string;
  platform: string;
  date: string;
  price: string;
  views: string;
  rating: string;
  published?: boolean;
  createdAt: string;
};

export type ExternalAdsBaseEntry = {
  id: string;
  nickname: string;
  socialLinks: ExternalAdsSocialLink[];
  history: ExternalAdsHistoryItem[];
  overallRating: string;
  comment: string;
  status: string;
  createdAt: string;
};

export type AccessRule = 'inherit' | 'allow' | 'deny';
export type ButtonAccessConfig = {
  roles?: Record<string, AccessRule>;
  employees?: Record<string, AccessRule>;
};
