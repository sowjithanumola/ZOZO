import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const supabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing.');
      // Return a dummy client or handle gracefully if keys are missing
    }
    
    supabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');
  }
  return supabaseClient;
};
