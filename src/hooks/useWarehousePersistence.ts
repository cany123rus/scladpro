import { useEffect, useRef, useState } from 'react';
import { loadWarehouseAssignmentsFromDb, persistWarehouseAssignmentsToDb } from '../services/warehouse.service';
import type { WarehouseAssignments } from '../utils/warehouse';

type ShowToast = (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;

export const useWarehousePersistence = (activeTab: string, showToast: ShowToast) => {
  const [warehouseAssignments, setWarehouseAssignments] = useState<WarehouseAssignments>({});
  const [warehouseAssignmentsLoaded, setWarehouseAssignmentsLoaded] = useState(false);
  const [warehouseAssignmentsDirty, setWarehouseAssignmentsDirty] = useState(false);
  const showToastRef = useRef(showToast);
  const loadErrorShownRef = useRef(false);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    const loadWarehouseAssignments = async () => {
      try {
        const normalized = await loadWarehouseAssignmentsFromDb();
        setWarehouseAssignments(normalized);
      } catch (e) {
        console.error('Failed to load warehouse shelves from app_settings', e);
        if (!loadErrorShownRef.current) {
          showToastRef.current('Ошибка загрузки полок из базы', 'error');
          loadErrorShownRef.current = true;
        }
      } finally {
        setWarehouseAssignmentsLoaded(true);
        setWarehouseAssignmentsDirty(false);
      }
    };

    loadWarehouseAssignments();
  }, []);

  useEffect(() => {
    if (activeTab !== 'warehouse') return;

    const syncFromDb = async () => {
      if (warehouseAssignmentsDirty) return;
      try {
        const normalized = await loadWarehouseAssignmentsFromDb();
        setWarehouseAssignments(normalized);
      } catch {}
    };

    syncFromDb();
  }, [activeTab, warehouseAssignmentsDirty]);

  useEffect(() => {
    if (!warehouseAssignmentsLoaded || !warehouseAssignmentsDirty) return;

    const persistWarehouseAssignments = async () => {
      try {
        await persistWarehouseAssignmentsToDb(warehouseAssignments);
        setWarehouseAssignmentsDirty(false);
      } catch (e) {
        console.error('Failed to persist warehouse shelves to app_settings', e);
        showToastRef.current('Ошибка сохранения полок в базу. Локальное сохранение отключено.', 'error');
      }
    };

    persistWarehouseAssignments();
  }, [warehouseAssignmentsLoaded, warehouseAssignmentsDirty, warehouseAssignments]);

  return {
    warehouseAssignments,
    setWarehouseAssignments,
    warehouseAssignmentsDirty,
    setWarehouseAssignmentsDirty,
  };
};
