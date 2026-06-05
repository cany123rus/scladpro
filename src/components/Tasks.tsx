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
import { Plus, Trash2, Calendar, X, Pencil } from 'lucide-react';
import { createTask, fetchActiveTasks, softDeleteTask, updateTask } from '../services/tasks.service';
import { buildTaskColumnUpdate, ColumnId, getTaskColumn, resolveDropColumn } from '../utils/tasks';
import { confirmDialog } from './ConfirmDialog';

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

const COLUMNS: { id: ColumnId; title: string; color: string }[] = [
  { id: 'priority-5', title: 'Честный знак', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { id: 'priority-4', title: 'Поставки', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'priority-1', title: 'Сделать сразу', color: 'bg-red-50 border-red-200 text-red-700' },
  { id: 'priority-2', title: 'Сборка очередь', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'priority-3', title: 'В работе!', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'done', title: 'Выполненные', color: 'bg-green-50 border-green-200 text-green-700' },
];

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

  return (
    <div ref={setNodeRef} style={style} className={`relative bg-white py-3 pr-3 pl-10 rounded-lg shadow-sm border border-slate-200 mb-2 group ${task.is_completed ? 'opacity-70' : ''}`} {...attributes} {...listeners}>
      <div className="absolute left-3 top-3 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600">
        <GripIcon />
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(task)} className="text-slate-300 hover:text-indigo-500">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(task.id)} className="text-slate-300 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="min-w-0 pr-5">
        <div className={`text-sm font-medium text-slate-900 whitespace-normal break-words leading-relaxed ${task.is_completed ? 'line-through text-slate-500' : ''}`}>{task.content}</div>
        {taskAssemblyFile?.url ? (
          <a
            href={taskAssemblyFile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 truncate"
            title="Файл сборки"
          >
            📎 Файл сборки
          </a>
        ) : task.priority === 2 ? (
          <div className="mt-1 text-xs text-rose-600">📎 Файл сборки не прикреплен</div>
        ) : null}
        {(assignment || acceptance) && (
          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
            {assignment && (
              <span className="inline-flex items-center gap-1 rounded bg-violet-50 text-violet-700 px-2 py-0.5">Поручено: {assignedToName || assignment.employeeName}</span>
            )}
            {acceptance && (
              <span className="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-2 py-0.5">В работе: {acceptedByName || acceptance.employeeName}</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
          <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
            <Calendar className="w-3 h-3" />
            {new Date(task.is_completed ? (task.completed_at || task.created_at) : task.created_at).toLocaleDateString('ru-RU')}
          </div>
          {task.quantity !== null && task.quantity > 0 && <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded"><span className="font-bold">{task.quantity}</span> шт.</div>}
        </div>

        <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 flex-wrap">
          {!task.is_completed && (
            <button
              onClick={() => onAcceptToggle(task)}
              disabled={!canAccept || !canAcceptThisTask}
              className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50"
              title={!canAccept ? 'Нужно войти как сотрудник' : (!canAcceptThisTask ? 'Задача поручена другому сотруднику' : '')}
            >
              {acceptance ? 'Снять принятие' : 'Принять в работу'}
            </button>
          )}
          <button
            onClick={() => onToggleComplete(task.id, task.is_completed)}
            disabled={!task.is_completed && !acceptance}
            title={!task.is_completed && !acceptance ? 'Сначала примите задачу в работу' : ''}
            className="px-3 py-1.5 text-xs font-medium rounded-lg disabled:opacity-50"
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
    <div ref={setNodeRef} className={`rounded-xl border ${col.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-30 ')} flex flex-col ${isOver ? 'ring-2 ring-indigo-400' : ''}`}>
      <div className={`p-3 font-bold border-b ${col.color.replace('text-', 'border-')} flex justify-between items-center`}>
        <span className="pr-2">{col.title}</span>
        <span className="bg-white bg-opacity-50 px-2 py-0.5 rounded-full text-xs">{tasks.length}</span>
      </div>
      <div className="p-2 flex-1 min-h-[100px]">
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
        {!loading && tasks.length === 0 && <div className="h-full flex items-center justify-center text-slate-400 text-sm italic py-4">Нет задач</div>}
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

  useEffect(() => {
    if (!tasks.length || !Object.keys(taskAssemblyFiles || {}).length) return;

    const now = Date.now();
    const ttlMs = 3 * 24 * 60 * 60 * 1000;
    let changed = false;
    const next: Record<string, TaskAssemblyFileMeta> = { ...(taskAssemblyFiles || {}) };

    tasks.forEach((task) => {
      if (!next[task.id]) return;
      if (!task.is_completed) return;
      const baseDate = task.completed_at || task.created_at;
      const ts = baseDate ? new Date(baseDate).getTime() : 0;
      if (!ts) return;
      if (now - ts >= ttlMs) {
        delete next[task.id];
        changed = true;
      }
    });

    if (changed) {
      setTaskAssemblyFiles(next);
      persistTaskAssemblyFiles(next);
    }
  }, [tasks, taskAssemblyFiles, persistTaskAssemblyFiles]);

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

  if (loading) return <div className="p-8 text-center text-slate-500">Загрузка задач...</div>;

  return (
    <div className="space-y-6">
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
                    <button onClick={() => toggleAcceptTask(task)} className="px-3 py-1.5 text-xs font-medium rounded-lg">Взять задачу в работу</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={addTask} className="oc-card p-4">
        <div className="flex flex-wrap gap-2">
          <input type="text" placeholder="Задача" value={newTaskContent} onChange={e => setNewTaskContent(e.target.value)} className="flex-1 min-w-[200px] oc-input" required />
          <select value={newTaskPriority} onChange={e => setNewTaskPriority(parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5)} className="oc-select">
            <option value={1}>Срочно</option><option value={2}>Сборка очередь</option><option value={3}>В работе!</option><option value={4}>Поставки</option><option value={5}>Честный знак</option>
          </select>
          <input type="date" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} className="oc-select" />
          {newTaskPriority === 2 && (
            <>
              <select value={newTaskSupplierId} onChange={e => setNewTaskSupplierId(e.target.value)} className="oc-select min-w-[220px]" required>
                <option value="">Поставщик для сборки...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
              <label className="oc-select min-w-[240px] cursor-pointer text-sm text-slate-600">
                {newTaskAssemblyFile ? `📎 ${newTaskAssemblyFile.name}` : '📎 Файл сборки (PDF)'}
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
                className="oc-select min-w-[260px]"
              >
                <option value="">Выбрать из истории заказов...</option>
                {supplierOrderHistory.map((item) => (
                  <option key={item.id} value={String(item.id)}>{item.fileName}</option>
                ))}
              </select>
            </>
          )}
          <select value={newTaskAssigneeId} onChange={e => setNewTaskAssigneeId(e.target.value)} className="oc-select min-w-[220px]">
            <option value="">Без исполнителя</option>
            {employees.map((e) => (
              <option key={e.id} value={String(e.id)}>{getEmployeeDisplayName(e as any)}</option>
            ))}
          </select>
          <input type="number" placeholder="Кол-во" value={newTaskQuantity} onChange={e => setNewTaskQuantity(e.target.value)} className="p-2 border rounded-lg w-24" />
          <button type="submit" disabled={!newTaskContent.trim()} className="btn-primary p-2"><Plus className="w-6 h-6" /></button>
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
