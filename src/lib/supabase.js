import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://blwrjkpzimpxbubrgcna.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sua-chave-anon-aqui";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);