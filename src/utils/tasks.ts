export type TaskPriority = 1 | 2 | 3 | 4 | 5;

export interface TaskLike {
  id: string;
  priority: TaskPriority;
  is_completed: boolean;
}

export type ColumnId = 'priority-1' | 'priority-2' | 'priority-3' | 'priority-4' | 'priority-5' | 'done';

export function getTaskColumn(task: TaskLike): ColumnId {
  return task.is_completed ? 'done' : (`priority-${task.priority}` as ColumnId);
}

export function parsePriorityFromColumn(column: Exclude<ColumnId, 'done'>): TaskPriority {
  return Number(column.split('-')[1]) as TaskPriority;
}

export function buildTaskColumnUpdate(targetColumn: ColumnId): { is_completed: boolean; priority?: TaskPriority } {
  if (targetColumn === 'done') return { is_completed: true };
  return { is_completed: false, priority: parsePriorityFromColumn(targetColumn) };
}

export function resolveDropColumn(
  overId: string,
  tasks: TaskLike[],
  columns: ColumnId[],
  overType?: string,
  overColumnId?: string,
): ColumnId | null {
  if (columns.includes(overId as ColumnId)) return overId as ColumnId;

  if (overType === 'task') {
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return null;
    return getTaskColumn(overTask);
  }

  if (overColumnId && columns.includes(overColumnId as ColumnId)) {
    return overColumnId as ColumnId;
  }

  return null;
}
