import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'En local: revisa tu archivo .env\n' +
    'En Vercel: Settings → Environment Variables'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)