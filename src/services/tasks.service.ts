import { supabase } from '../lib/supabase';

export interface TaskPayload {
  content: string;
  priority: 1 | 2 | 3 | 4 | 5;
  due_date: string | null;
  quantity: number | null;
  is_completed: boolean;
  completed_at?: string | null;
}

export async function fetchActiveTasks() {
  return supabase
    .from('tasks')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
}

export async function createTask(payload: TaskPayload) {
  return supabase.from('tasks').insert(payload).select('id').single();
}

export async function updateTask(id: string, updates: Partial<TaskPayload>) {
  return supabase.from('tasks').update(updates).eq('id', id);
}

export async function softDeleteTask(id: string) {
  return supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
}
