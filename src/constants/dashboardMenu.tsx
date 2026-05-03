import {
  CheckSquare,
  Box,
  Camera,
  Map as MapIcon,
  Package,
  ShoppingBag,
  Truck,
  ShoppingCart,
  ClipboardCheck,
  Users,
  ShieldCheck,
  Trash2,
  FileText,
  BarChart2,
  Wallet,
  MessageSquare,
  Link,
  Send,
  UserCog,
  Database,
} from 'lucide-react';
import type { DashboardTabId } from './dashboardTabs';

export type DashboardMenuItem = {
  id: DashboardTabId;
  label: string;
  icon: any;
};

export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = [
  { id: 'tasks', icon: CheckSquare, label: 'Задачи' },
  { id: 'warehouse', icon: Box, label: 'Склад' },
  { id: 'cameras', icon: Camera, label: 'Камеры' },
  { id: 'map', icon: MapIcon, label: 'Конструктор этикеток' },
  { id: 'products', icon: Package, label: 'Товары' },
  { id: 'wb_products', icon: ShoppingBag, label: 'Товары WB' },
  { id: 'fbs', icon: Truck, label: 'Поставки FBS' },
  { id: 'supplies', icon: Truck, label: 'Поставки FBO' },
  { id: 'orders', icon: ShoppingCart, label: 'Заказ товара' },
  { id: 'reception', icon: ClipboardCheck, label: 'Приемка товара' },
  { id: 'suppliers', icon: Users, label: 'Поставщики' },
  { id: 'honest_sign', icon: ShieldCheck, label: 'ЧЗ / Печать' },
  { id: 'completed', icon: CheckSquare, label: 'Сборка' },
  { id: 'trash', icon: Trash2, label: 'Удаление' },
  { id: 'reports', icon: FileText, label: 'Отчеты' },
  { id: 'analytics', icon: BarChart2, label: 'Аналитика' },
  { id: 'advertising', icon: Wallet, label: 'Реклама' },
  { id: 'instagram', icon: MessageSquare, label: 'Instagram' },
  { id: 'barters', icon: Link, label: 'Бартеры / Внешняя реклама' },
  { id: 'telegram', icon: Send, label: 'Telegram' },
  { id: 'employees', icon: UserCog, label: 'Сотрудники' },
  { id: 'database', icon: Database, label: 'База данных' },
];
