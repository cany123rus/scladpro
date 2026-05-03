import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://blygwkxjogmioebutiwn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});