import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Calendar, X, Pencil, CheckSquare } from 'lucide-react';
import { createTask, fetchActiveTasks, softDeleteTask, updateTask } from '../services/tasks.service';
import { buildTaskColumnUpdate, ColumnId, getTaskColumn, resolveDropColumn } from '../utils/tasks';
import { confirmDialog } from './ConfirmDialog';
import { sendPush } from '../utils/push';

interface Task {
  id: string;
  content: string;
  priority: 1 | 2 | 3 | 4 | 5;
  due_date: string | null;
  quantity: number | null;
  is_completed: boolean;
  created_at: string;
  completed_at?: string | null;
}

interface TaskAssemblyFileMeta {
  url: string;
  name: string;
  supplierName?: string;
  uploadedAt?: string;
}

interface TaskAcceptance {
  employeeId: string;
  employeeName: string;
  acceptedAt: string;
}

interface TaskAssignment {
  employeeId: string;
  employeeName: string;
  assignedAt: string;
}

type ColumnMeta = {
  id: ColumnId; title: string; accent: string; soft: string; ring: string; text: string; dot: string; chip: string;
};
const COLUMNS: ColumnMeta[] = [
  { id: 'priority-5', title: 'Честный знак', accent: '#ec4899', soft: 'bg-pink-50/60', ring: 'border-pink-200', text: 'text-pink-700', dot: 'bg-pink-500', chip: 'bg-pink-100 text-pink-700' },
  { id: 'priority-4', title: 'Поставки', accent: '#a855f7', soft: 'bg-purple-50/60', ring: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500', chip: 'bg-purple-100 text-purple-700' },
  { id: 'priority-1', title: 'Сделать сразу', accent: '#ef4444', soft: 'bg-rose-50/60', ring: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', chip: 'bg-rose-100 text-rose-700' },
  { id: 'priority-2', title: 'Сборка очередь', accent: '#f59e0b', soft: 'bg-amber-50/60', ring: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', chip: 'bg-amber-100 text-amber-700' },
  { id: 'priority-3', title: 'В работе!', accent: '#3b82f6', soft: 'bg-blue-50/60', ring: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', chip: 'bg-blue-100 text-blue-700' },
  { id: 'done', title: 'Выполненные', accent: '#10b981', soft: 'bg-emerald-50/60', ring: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700' },
];
const accentByPriority = (p: number): string => (COLUMNS.find((c) => c.id === `priority-${p}`)?.accent || '#94a3b8');
const initialsOf = (name?: string) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const normalizeBossName = (name?: string | null) => {
  const src = String(name || '').trim().toLowerCase();
  if (!src) return 'Сотрудник';
  if (src.includes('admin') || src.includes('админ')) return 'Босс';
  return String(name).trim();
};

const GripIcon = memo(() => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400">
    <circle cx="5" cy="3" r="1.5" fill="currentColor" />
    <circle cx="11" cy="3" r="1.5" fill="currentColor" />
    <circle cx="5" cy="8" r="1.5" fill="currentColor" />
    <circle cx="11" cy="8" r="1.5" fill="currentColor" />
    <circle cx="5" cy="13" r="1.5" fill="currentColor" />
    <circle cx="11" cy="13" r="1.5" fill="currentColor" />
  </svg>
));
GripIcon.displayName = 'GripIcon';

const SortableTaskItem = memo(({ task, onToggleComplete, onDelete, onEdit, taskAssemblyFile, acceptance, assignment, acceptedByName, assignedToName, canAccept, canAcceptThisTask, onAcceptToggle }: {
  task: Task;
  onToggleComplete: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  taskAssemblyFile?: TaskAssemblyFileMeta;
  acceptance?: TaskAcceptance;
  assignment?: TaskAssignment;
  acceptedByName?: string;
  assignedToName?: string;
  canAccept: boolean;
  canAcceptThisTask: boolean;
  onAcceptToggle: (task: Task) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative' as const,
  };

  const dueTs = task.due_date ? new Date(task.due_date).getTime() : null;
  const overdue = !task.is_completed && dueTs !== null && dueTs < new Date(new Date().toDateString()).getTime();
  const accent = task.is_completed ? '#10b981' : accentByPriority(task.priority);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: accent }}
      className={`relative bg-white py-3 pr-3 pl-10 rounded-xl shadow-sm hover:shadow-md border border-slate-200 border-l-[3px] mb-2.5 group transition-shadow ${task.is_completed ? 'opacity-75' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="absolute left-2.5 top-3.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
        <GripIcon />
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Редактировать">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50" title="Удалить">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="min-w-0 pr-6">
        <div className={`text-sm font-semibold text-slate-900 whitespace-normal break-words leading-snug ${task.is_completed ? 'line-through text-slate-400' : ''}`}>{task.content}</div>

        {taskAssemblyFile?.url ? (
          <a
            href={taskAssemblyFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex max-w-full items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 truncate"
            title="Файл сборки"
          >
            📎 Файл сборки
          </a>
        ) : task.priority === 2 ? (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600">📎 Файл не прикреплён</div>
        ) : null}

        {(assignment || acceptance) && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {assignment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 text-violet-700 pl-1 pr-2 py-0.5 font-medium">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white">{initialsOf(assignedToName || assignment.employeeName)}</span>
                {assignedToName || assignment.employeeName}
              </span>
            )}
            {acceptance && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 pl-1 pr-2 py-0.5 font-medium">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">{initialsOf(acceptedByName || acceptance.employeeName)}</span>
                В работе: {acceptedByName || acceptance.employeeName}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${overdue ? 'bg-rose-100 text-rose-700 font-semibold' : 'bg-slate-100 text-slate-500'}`} title={overdue ? 'Просрочена' : undefined}>
            <Calendar className="w-3 h-3" />
            {new Date(task.is_completed ? (task.completed_at || task.created_at) : (task.due_date || task.created_at)).toLocaleDateString('ru-RU')}
          </div>
          {task.quantity !== null && task.quantity > 0 && <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md"><span className="font-bold">{task.quantity}</span> шт.</div>}
        </div>

        <div className="mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 flex-wrap">
          {!task.is_completed && (
            <button
              onClick={() => onAcceptToggle(task)}
              disabled={!canAccept || !canAcceptThisTask}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${acceptance ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              title={!canAccept ? 'Нужно войти как сотрудник' : (!canAcceptThisTask ? 'Задача поручена другому сотруднику' : '')}
            >
              {acceptance ? 'Снять принятие' : 'Принять в работу'}
            </button>
          )}
          <button
            onClick={() => onToggleComplete(task.id, task.is_completed)}
            disabled={!task.is_completed && !acceptance}
            title={!task.is_completed && !acceptance ? 'Сначала примите задачу в работу' : ''}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${task.is_completed ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {task.is_completed ? 'Вернуть в работу' : 'Выполнено'}
          </button>
        </div>
      </div>
    </div>
  );
});
SortableTaskItem.displayName = 'SortableTaskItem';

const TaskColumn = memo(({ col, tasks, loading, onToggleComplete, onDelete, onEdit, taskAssemblyFiles, acceptances, assignments, currentEmployeeId, canAccept, onAcceptToggle }: {
  col: { id: ColumnId; title: string; color: string };
  tasks: Task[];
  loading: boolean;
  onToggleComplete: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  taskAssemblyFiles: Record<string, TaskAssemblyFileMeta>;
  acceptances: Record<string, TaskAcceptance>;
  assignments: Record<string, TaskAssignment>;
  currentEmployeeId?: string;
  canAccept: boolean;
  onAcceptToggle: (task: Task) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id, data: { type: 'column', columnId: col.id } });

  return (
    <div ref={setNodeRef} className={`rounded-2xl border ${col.ring} ${col.soft} flex flex-col transition-all ${isOver ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}>
      <div className="px-3.5 py-3 flex items-center justify-between gap-2 border-b border-slate-200/70" style={{ borderTopColor: col.accent }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${col.dot}`} />
          <span className={`font-bold text-sm truncate ${col.text}`}>{col.title}</span>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${col.chip}`}>{tasks.length}</span>
      </div>
      <div className="p-2 flex-1 min-h-[120px]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-400">Загрузка...</div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => {
              const assignment = assignments[task.id];
              const acceptance = acceptances[task.id];
              const canAcceptThisTask = !assignment || assignment.employeeId === currentEmployeeId;
              const acceptedByName = acceptance ? normalizeBossName(acceptance.employeeName) : undefined;
              const assignedToName = assignment ? normalizeBossName(assignment.employeeName) : undefined;
              return <SortableTaskItem key={task.id} task={task} onToggleComplete={onToggleComplete} onDelete={onDelete} onEdit={onEdit} taskAssemblyFile={taskAssemblyFiles[task.id]} acceptance={acceptance} assignment={assignment} acceptedByName={acceptedByName} assignedToName={assignedToName} canAccept={canAccept} canAcceptThisTask={canAcceptThisTask} onAcceptToggle={onAcceptToggle} />;
            })}
          </SortableContext>
        )}
        {!loading && tasks.length === 0 && <div className="flex items-center justify-center text-slate-300 text-xs py-8 border-2 border-dashed border-slate-200 rounded-xl m-1">Перетащите задачу сюда</div>}
      </div>
    </div>
  );
});
TaskColumn.displayName = 'TaskColumn';

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<1 | 2 | 3 | 4 | 5>(1);
  const todayIso = new Date().toISOString().split('T')[0];
  const [newTaskDate, setNewTaskDate] = useState(todayIso);
  const [newTaskQuantity, setNewTaskQuantity] = useState('');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState('');
  const [taskAcceptances, setTaskAcceptances] = useState<Record<string, TaskAcceptance>>({});
  const [taskAssignments, setTaskAssignments] = useState<Record<string, TaskAssignment>>({});
  const [employees, setEmployees] = useState<Array<{ id: string; full_name?: string; login?: string; role?: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [newTaskSupplierId, setNewTaskSupplierId] = useState('');
  const [newTaskAssemblyFile, setNewTaskAssemblyFile] = useState<File | null>(null);
  const [supplierOrderHistory, setSupplierOrderHistory] = useState<Array<{ id: string; supplierId: string; supplierName: string; createdAt: string; fileName: string; dataUrl: string; totalQty: number; totalCost: number }>>([]);
  const [taskAssemblyFiles, setTaskAssemblyFiles] = useState<Record<string, TaskAssemblyFileMeta>>({});
  const [showAssignedModal, setShowAssignedModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<{ content: string; priority: 1 | 2 | 3 | 4 | 5; due_date: string; quantity: string }>({
    content: '', priority: 1, due_date: '', quantity: ''
  });

  const currentEmployee = useMemo(() => {
    try {
      const raw = localStorage.getItem('current_employee');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);
  const currentEmployeeId = currentEmployee?.id ? String(currentEmployee.id) : '';
  const canAccept = Boolean(currentEmployee?.id && (currentEmployee?.full_name || currentEmployee?.login));

  const getEmployeeDisplayName = useCallback((employee: { id: string; full_name?: string; login?: string; role?: string }) => {
    const role = String(employee?.role || '').toLowerCase();
    const login = String(employee?.login || '').toLowerCase();
    if (role === 'admin' || login === 'admin') return 'Босс';
    return String(employee?.full_name || employee?.login || employee?.id || 'Сотрудник');
  }, []);


  const fetchTasks = async () => {
    try {
      const { data, error } = await fetchActiveTasks();
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const subscription = supabase.channel('tasks_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks).subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const loadTaskMeta = async () => {
      try {
        const [{ data: acceptRows }, { data: assignRows }, { data: fileRows }, { data: empRows }, { data: supplierRows }] = await Promise.all([
          supabase.from('app_settings').select('value').eq('key', 'task_acceptances_v1').limit(1),
          supabase.from('app_settings').select('value').eq('key', 'task_assignments_v1').limit(1),
          supabase.from('app_settings').select('value').eq('key', 'task_assembly_files_v1').limit(1),
          supabase.from('employees').select('id, full_name, login, role').is('deleted_at', null),
          supabase.from('suppliers').select('id, name').is('deleted_at', null).order('name', { ascending: true }),
        ]);

        const acceptRow = Array.isArray(acceptRows) ? acceptRows[0] : null;
        const assignRow = Array.isArray(assignRows) ? assignRows[0] : null;
        const fileRow = Array.isArray(fileRows) ? fileRows[0] : null;

        const parsedAccept = acceptRow?.value ? (typeof acceptRow.value === 'string' ? JSON.parse(acceptRow.value) : acceptRow.value) : {};
        const parsedAssign = assignRow?.value ? (typeof assignRow.value === 'string' ? JSON.parse(assignRow.value) : assignRow.value) : {};
        const parsedFiles = fileRow?.value ? (typeof fileRow.value === 'string' ? JSON.parse(fileRow.value) : fileRow.value) : {};

        if (parsedAccept && typeof parsedAccept === 'object') setTaskAcceptances(parsedAccept as Record<string, TaskAcceptance>);
        if (parsedAssign && typeof parsedAssign === 'object') setTaskAssignments(parsedAssign as Record<string, TaskAssignment>);
        if (parsedFiles && typeof parsedFiles === 'object') setTaskAssemblyFiles(parsedFiles as Record<string, TaskAssemblyFileMeta>);
        setEmployees((empRows as any) || []);
        setSuppliers(((supplierRows as any) || []).filter((s: any) => String(s?.name || '').trim()));
      } catch {
        // no-op
      }
    };
    loadTaskMeta();
  }, []);

  useEffect(() => {
    const loadSupplierOrderHistory = async () => {
      if (!newTaskSupplierId || newTaskPriority !== 2) {
        setSupplierOrderHistory([]);
        return;
      }
      try {
        const key = `supplier_order_history_v1:${newTaskSupplierId}`;
        const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
        const parsed = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : [];
        setSupplierOrderHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSupplierOrderHistory([]);
      }
    };
    loadSupplierOrderHistory();
  }, [newTaskSupplierId, newTaskPriority]);

  const persistTaskAcceptances = useCallback(async (next: Record<string, TaskAcceptance>) => {
    try {
      const raw = JSON.stringify(next || {});
      const { data: updatedRows, error: updateError } = await supabase
        .from('app_settings')
        .update({ value: raw })
        .eq('key', 'task_acceptances_v1')
        .select('key');
      if (updateError) throw updateError;
      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from('app_settings').insert({ key: 'task_acceptances_v1', value: raw });
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving task acceptances:', error);
    }
  }, []);

  const persistTaskAssignments = useCallback(async (next: Record<string, TaskAssignment>) => {
    try {
      const raw = JSON.stringify(next || {});
      const { data: updatedRows, error: updateError } = await supabase
        .from('app_settings')
        .update({ value: raw })
        .eq('key', 'task_assignments_v1')
        .select('key');
      if (updateError) throw updateError;
      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from('app_settings').insert({ key: 'task_assignments_v1', value: raw });
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving task assignments:', error);
    }
  }, []);

  const persistTaskAssemblyFiles = useCallback(async (next: Record<string, TaskAssemblyFileMeta>) => {
    try {
      const raw = JSON.stringify(next || {});
      const { data: updatedRows, error: updateError } = await supabase
        .from('app_settings')
        .update({ value: raw })
        .eq('key', 'task_assembly_files_v1')
        .select('key');
      if (updateError) throw updateError;
      if (!updatedRows || updatedRows.length === 0) {
        const { error: insertError } = await supabase.from('app_settings').insert({ key: 'task_assembly_files_v1', value: raw });
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving task assembly files:', error);
    }
  }, []);

  const uploadAssemblyTaskFile = useCallback(async (taskId: string, file: File, supplierName?: string) => {
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const supplierRaw = String(supplierName || 'supplier').trim();
    const safeSupplierSlug = supplierRaw
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'supplier';

    // For storage key use ASCII only
    const storageFileName = `assembly_file_${safeSupplierSlug}.${ext}`;
    const path = `assembly_tasks/${taskId}/${Date.now()}_${storageFileName}`;

    const { error } = await supabase.storage.from('orders').upload(path, file, { upsert: true, contentType: file.type || 'application/pdf' });

    if (!error) {
      const { data } = supabase.storage.from('orders').getPublicUrl(path);
      return { url: data.publicUrl, name: 'Файл сборки', supplierName } as TaskAssemblyFileMeta;
    }

    const storageErrorDetails = [error?.message, error?.name, (error as any)?.statusCode, (error as any)?.error].filter(Boolean).join(' | ');

    // Fallback when storage bucket/policies are not configured: keep file inline in task meta
    if (file.size > 3 * 1024 * 1024) {
      throw new Error(`Storage upload error: ${storageErrorDetails || 'unknown'}; файл слишком большой для fallback (>3MB)`);
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('Не удалось прочитать PDF файл'));
      r.readAsDataURL(file);
    });

    if (!String(dataUrl).startsWith('data:application/pdf')) {
      throw new Error('Fallback поддерживает только PDF');
    }

    return { url: dataUrl, name: 'Файл сборки', supplierName } as TaskAssemblyFileMeta;
  }, []);

  // Удаление самого файла из бакета (а не только ссылки). Для data:-URL (fallback) нечего удалять.
  const removeTaskFileFromStorage = useCallback(async (meta?: TaskAssemblyFileMeta) => {
    const url = String(meta?.url || '');
    const marker = '/object/public/orders/';
    const i = url.indexOf(marker);
    if (i === -1) return; // data-url или не из стораджа
    const path = url.slice(i + marker.length);
    if (!path) return;
    try {
      await supabase.storage.from('orders').remove([path]);
    } catch (e) {
      console.warn('Не удалось удалить файл сборки из бакета:', e);
    }
  }, []);

  // Авто-очистка: файл выполненной задачи хранится 2 недели, затем удаляется и из бакета, и из ссылок.
  // Возврат задачи в работу сбрасывает таймер (is_completed=false → не чистим), файл не теряется.
  useEffect(() => {
    if (!tasks.length || !Object.keys(taskAssemblyFiles || {}).length) return;

    const now = Date.now();
    const ttlMs = 14 * 24 * 60 * 60 * 1000;
    let changed = false;
    const next: Record<string, TaskAssemblyFileMeta> = { ...(taskAssemblyFiles || {}) };
    const toRemove: TaskAssemblyFileMeta[] = [];

    tasks.forEach((task) => {
      if (!next[task.id]) return;
      if (!task.is_completed) return;
      const baseDate = task.completed_at || task.created_at;
      const ts = baseDate ? new Date(baseDate).getTime() : 0;
      if (!ts) return;
      if (now - ts >= ttlMs) {
        toRemove.push(next[task.id]);
        delete next[task.id];
        changed = true;
      }
    });

    if (changed) {
      toRemove.forEach((meta) => { void removeTaskFileFromStorage(meta); });
      setTaskAssemblyFiles(next);
      persistTaskAssemblyFiles(next);
    }
  }, [tasks, taskAssemblyFiles, persistTaskAssemblyFiles, removeTaskFileFromStorage]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskContent.trim()) return;
    try {
      const supplierName = suppliers.find((s) => String(s.id) === String(newTaskSupplierId))?.name || '';
      const finalContent = newTaskPriority === 2
        ? `Сборка${supplierName ? ` • ${supplierName}` : ''}: ${newTaskContent}`
        : newTaskContent;

      const { data, error } = await createTask({
        content: finalContent,
        priority: newTaskPriority,
        due_date: newTaskDate || null,
        quantity: newTaskQuantity ? parseInt(newTaskQuantity, 10) : null,
        is_completed: false,
      });
      if (error) throw error;

      if (newTaskAssigneeId && data?.id) {
        const assignee = employees.find((e) => String(e.id) === String(newTaskAssigneeId));
        if (assignee) {
          setTaskAssignments((prev) => {
            const next = {
              ...(prev || {}),
              [data.id]: {
                employeeId: String(assignee.id),
                employeeName: getEmployeeDisplayName(assignee as any),
                assignedAt: new Date().toISOString(),
              },
            };
            persistTaskAssignments(next);
            return next;
          });
          // Push-уведомление назначенному сотруднику.
          sendPush({
            title: 'Новая задача',
            body: finalContent.slice(0, 120),
            url: '/tasks',
            target: [String(assignee.id)],
          }).catch(() => undefined);
        }
      }

      if (newTaskPriority === 2 && newTaskAssemblyFile && data?.id) {
        try {
          const supplierNameForFile = suppliers.find((s) => String(s.id) === String(newTaskSupplierId))?.name || '';
          const meta = await uploadAssemblyTaskFile(String(data.id), newTaskAssemblyFile, supplierNameForFile);
          setTaskAssemblyFiles((prev) => {
            const next = { ...(prev || {}), [String(data.id)]: meta };
            persistTaskAssemblyFiles(next);
            return next;
          });
        } catch (e: any) {
          console.error('Error uploading assembly task file:', e);
          alert(`Задача создана, но файл сборки не загрузился: ${String(e?.message || 'неизвестно')}`);
        }
      }

      setNewTaskContent('');
      setNewTaskDate(todayIso);
      setNewTaskQuantity('');
      setNewTaskAssigneeId('');
      setNewTaskSupplierId('');
      setNewTaskAssemblyFile(null);
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      content: task.content || '',
      priority: task.priority,
      due_date: task.due_date ? String(task.due_date).slice(0, 10) : '',
      quantity: task.quantity != null ? String(task.quantity) : '',
    });
  };

  const saveEditTask = async () => {
    if (!editingTask) return;
    try {
      const updates: any = {
        content: editTaskForm.content,
        priority: editTaskForm.priority,
        due_date: editTaskForm.due_date || null,
        quantity: editTaskForm.quantity ? parseInt(editTaskForm.quantity, 10) : null,
      };
      const { error } = await updateTask(editingTask.id, updates);
      if (error) throw error;
      setEditingTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    try {
      const nextCompleted = !current;
      const updates = {
        is_completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null,
      } as any;

      let { error } = await updateTask(id, updates);

      // Backward compatibility: if DB has no completed_at column yet, retry without it
      if (error && String((error as any)?.message || '').toLowerCase().includes('completed_at')) {
        const fallback = await updateTask(id, { is_completed: nextCompleted } as any);
        error = fallback.error;
      }

      if (error) throw error;

      setTasks(prev => prev.map(t => (
        t.id === id
          ? { ...t, is_completed: nextCompleted, completed_at: nextCompleted ? new Date().toISOString() : null }
          : t
      )));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const toggleAcceptTask = useCallback((task: Task) => {
    if (!canAccept || !currentEmployee?.id) return;

    const assigned = taskAssignments[task.id];
    if (assigned && assigned.employeeId !== String(currentEmployee.id)) return;

    setTaskAcceptances((prev) => {
      const next = { ...(prev || {}) };
      if (next[task.id]) {
        delete next[task.id];
      } else {
        next[task.id] = {
          employeeId: String(currentEmployee.id),
          employeeName: getEmployeeDisplayName(currentEmployee as any),
          acceptedAt: new Date().toISOString(),
        };
      }
      persistTaskAcceptances(next);
      return next;
    });
  }, [canAccept, currentEmployee, persistTaskAcceptances, taskAssignments]);

  const deleteTask = async (id: string) => {
    if (!(await confirmDialog({ title: 'Удаление задачи', message: 'Удалить задачу?', tone: 'danger' }))) return;
    try {
      const { error } = await softDeleteTask(id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== id));
      setTaskAcceptances((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        persistTaskAcceptances(next);
        return next;
      });
      setTaskAssignments((prev) => {
        if (!prev[id]) return prev;
        const next = { ...prev };
        delete next[id];
        persistTaskAssignments(next);
        return next;
      });
      // Удаляем прикреплённый файл сборки: и сам объект из бакета, и ссылку.
      setTaskAssemblyFiles((prev) => {
        if (!prev[id]) return prev;
        void removeTaskFileFromStorage(prev[id]);
        const next = { ...prev };
        delete next[id];
        persistTaskAssemblyFiles(next);
        return next;
      });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: undefined })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    const targetColumn = resolveDropColumn(
      String(over.id),
      tasks,
      COLUMNS.map((c) => c.id),
      over.data.current?.type,
      (over.data.current as { columnId?: string } | undefined)?.columnId,
    );

    if (!targetColumn) return;

    const currentColumn = getTaskColumn(activeTask);
    if (targetColumn === currentColumn) return;

    setTasks(prev => prev.map(t => {
      if (t.id !== activeTask.id) return t;
      return { ...t, ...buildTaskColumnUpdate(targetColumn) };
    }));

    try {
      const updates = buildTaskColumnUpdate(targetColumn);
      const { error } = await updateTask(activeTask.id, updates);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating task:', error);
      fetchTasks();
    }
  }, [tasks]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<ColumnId, Task[]> = { 'priority-1': [], 'priority-2': [], 'priority-3': [], 'priority-4': [], 'priority-5': [], done: [] };
    tasks.forEach(task => {
      if (task.is_completed) grouped.done.push(task);
      else grouped[`priority-${task.priority}` as ColumnId].push(task);
    });

    const byDateAsc = (a: Task, b: Task) => {
      const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    };

    (Object.keys(grouped) as ColumnId[]).forEach((key) => grouped[key].sort(byDateAsc));

    grouped.done.sort((a, b) => {
      const aTime = new Date(a.completed_at || a.created_at).getTime();
      const bTime = new Date(b.completed_at || b.created_at).getTime();
      return bTime - aTime;
    });

    return grouped;
  }, [tasks]);

  const pendingAssignedTasks = useMemo(() => {
    if (!currentEmployeeId) return [] as Task[];
    return tasks.filter((t) => {
      if (t.is_completed) return false;
      const assignment = taskAssignments[t.id];
      if (!assignment || assignment.employeeId !== currentEmployeeId) return false;
      return !taskAcceptances[t.id];
    });
  }, [tasks, taskAssignments, taskAcceptances, currentEmployeeId]);

  useEffect(() => {
    if (pendingAssignedTasks.length > 0) setShowAssignedModal(true);
  }, [pendingAssignedTasks.length]);

  const stats = useMemo(() => {
    const active = tasks.filter((t) => !t.is_completed);
    const done = tasks.filter((t) => t.is_completed);
    const todayStart = new Date(new Date().toDateString()).getTime();
    const overdue = active.filter((t) => t.due_date && new Date(t.due_date).getTime() < todayStart).length;
    const inWork = active.filter((t) => taskAcceptances[t.id]).length;
    return { active: active.length, done: done.length, overdue, inWork };
  }, [tasks, taskAcceptances]);

  if (loading) return <div className="p-8 text-center text-slate-500">Загрузка задач...</div>;

  return (
    <div className="space-y-5">
      {/* Шапка раздела со статистикой */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 p-5 sm:p-6 shadow-xl ring-1 ring-white/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <CheckSquare className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Задачи</h1>
              <p className="mt-0.5 text-sm text-indigo-100/80">Канбан-доска: перетаскивайте карточки между колонками</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'Активных', value: stats.active, c: 'text-white' },
              { label: 'В работе', value: stats.inWork, c: 'text-blue-300' },
              { label: 'Просрочено', value: stats.overdue, c: 'text-rose-300' },
              { label: 'Выполнено', value: stats.done, c: 'text-emerald-300' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 px-3 py-2 text-center ring-1 ring-white/10 min-w-[72px]">
                <div className={`text-xl font-extrabold ${s.c}`}>{s.value}</div>
                <div className="text-[10px] text-indigo-100/70 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAssignedModal && pendingAssignedTasks.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAssignedModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900">Назначенные вам задачи</h3>
              <button onClick={() => setShowAssignedModal(false)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {pendingAssignedTasks.map((task) => (
                <div key={`assigned-${task.id}`} className="border border-slate-200 rounded-xl p-3">
                  <div className="text-sm font-medium text-slate-900">{task.content}</div>
                  <div className="mt-2">
                    <button onClick={() => toggleAcceptTask(task)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Взять задачу в работу</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={addTask} className="oc-card p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600"><Plus className="h-4 w-4" /></span>
          Новая задача
        </div>

        {/* Текст задачи */}
        <input
          type="text"
          placeholder="Что нужно сделать?"
          value={newTaskContent}
          onChange={e => setNewTaskContent(e.target.value)}
          className="oc-input w-full text-base mb-4"
          required
        />

        {/* Приоритет — цветные чипы */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Колонка / приоритет</div>
          <div className="flex flex-wrap gap-2">
            {[
              { p: 1, label: 'Срочно' },
              { p: 2, label: 'Сборка очередь' },
              { p: 3, label: 'В работе!' },
              { p: 4, label: 'Поставки' },
              { p: 5, label: 'Честный знак' },
            ].map(({ p, label }) => {
              const on = newTaskPriority === p;
              const accent = accentByPriority(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewTaskPriority(p as 1 | 2 | 3 | 4 | 5)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${on ? 'text-white shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                  style={on ? { backgroundColor: accent, borderColor: accent } : undefined}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: on ? '#fff' : accent }} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Дата / Исполнитель / Кол-во */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Срок</div>
            <input type="date" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} className="oc-input w-full" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Исполнитель</div>
            <select value={newTaskAssigneeId} onChange={e => setNewTaskAssigneeId(e.target.value)} className="oc-select w-full">
              <option value="">Без исполнителя</option>
              {employees.map((e) => (
                <option key={e.id} value={String(e.id)}>{getEmployeeDisplayName(e as any)}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Количество</div>
            <input type="number" placeholder="шт." value={newTaskQuantity} onChange={e => setNewTaskQuantity(e.target.value)} className="oc-input w-full" />
          </div>
        </div>

        {/* Блок сборки — только для «Сборка очередь» */}
        {newTaskPriority === 2 && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 mb-2">Данные сборки</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={newTaskSupplierId} onChange={e => setNewTaskSupplierId(e.target.value)} className="oc-select w-full" required>
                <option value="">Поставщик для сборки…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
              <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${newTaskAssemblyFile ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                <span className="truncate">{newTaskAssemblyFile ? `📎 ${newTaskAssemblyFile.name}` : '📎 Файл сборки (PDF)'}</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setNewTaskAssemblyFile(e.target.files?.[0] || null)}
                />
              </label>
              <select
                value=""
                onChange={async (e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) return;
                  const selected = supplierOrderHistory.find((x) => String(x.id) === String(selectedId));
                  if (!selected?.dataUrl) return;
                  try {
                    const res = await fetch(selected.dataUrl);
                    const blob = await res.blob();
                    const file = new File([blob], selected.fileName || 'assembly_order.pdf', { type: 'application/pdf' });
                    setNewTaskAssemblyFile(file);
                  } catch (err) {
                    console.error('Failed to load order history PDF', err);
                  }
                }}
                className="oc-select w-full"
              >
                <option value="">Из истории заказов…</option>
                {supplierOrderHistory.map((item) => (
                  <option key={item.id} value={String(item.id)}>{item.fileName}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={!newTaskContent.trim()} className="btn-primary px-5 py-2.5 inline-flex items-center gap-2 font-semibold disabled:opacity-50">
            <Plus className="w-5 h-5" /> Добавить задачу
          </button>
        </div>
      </form>

      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900">Редактирование задачи</h3>
              <button onClick={() => setEditingTask(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-3">
              <input value={editTaskForm.content} onChange={(e) => setEditTaskForm((p) => ({ ...p, content: e.target.value }))} className="oc-input" placeholder="Текст задачи" />
              <div className="grid grid-cols-2 gap-2">
                <select value={editTaskForm.priority} onChange={(e) => setEditTaskForm((p) => ({ ...p, priority: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))} className="oc-select">
                  <option value={1}>Срочно</option><option value={2}>Сборка очередь</option><option value={3}>В работе!</option><option value={4}>Поставки</option><option value={5}>Честный знак</option>
                </select>
                <input type="date" value={editTaskForm.due_date} onChange={(e) => setEditTaskForm((p) => ({ ...p, due_date: e.target.value }))} className="oc-select" />
              </div>
              <input type="number" value={editTaskForm.quantity} onChange={(e) => setEditTaskForm((p) => ({ ...p, quantity: e.target.value }))} className="oc-input" placeholder="Количество" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditingTask(null)} className="px-3 py-2 rounded-lg border">Отмена</button>
              <button onClick={saveEditTask} className="btn-primary px-3 py-2">Сохранить</button>
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {COLUMNS.filter((col) => col.id !== 'done').map(col => (
            <TaskColumn key={col.id} col={col} tasks={tasksByColumn[col.id]} loading={loading} onToggleComplete={toggleComplete} onDelete={deleteTask} onEdit={startEditTask} taskAssemblyFiles={taskAssemblyFiles} acceptances={taskAcceptances} assignments={taskAssignments} currentEmployeeId={currentEmployeeId} canAccept={canAccept} onAcceptToggle={toggleAcceptTask} />
          ))}
        </div>

        <div className="mt-4">
          <TaskColumn col={COLUMNS.find((c) => c.id === 'done')!} tasks={tasksByColumn.done} loading={loading} onToggleComplete={toggleComplete} onDelete={deleteTask} onEdit={startEditTask} taskAssemblyFiles={taskAssemblyFiles} acceptances={taskAcceptances} assignments={taskAssignments} currentEmployeeId={currentEmployeeId} canAccept={canAccept} onAcceptToggle={toggleAcceptTask} />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-indigo-200 opacity-90 rotate-2 cursor-grabbing">
              <div className="font-medium text-slate-900">{tasks.find(t => t.id === activeId)?.content}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
