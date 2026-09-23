import { createClient } from '@supabase/supabase-js'

// Estas variables se configuran en el archivo .env (ver .env.example)
// Vercel: agrégalas en Settings > Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
