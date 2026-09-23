import { createClient } from '@supabase/supabase-js'

// Estas variables se configuran en el archivo .env (ver .env.example)
// Vercel: agrégalas en Settings > Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tmkantmqtdcrxivaeziw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta2FudG1xdGRjcnhpdmFleml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMzk5NTQsImV4cCI6MjEwNTYxNTk1NH0.7v4Iy3pamCv4F3C_2bKE_TyBEfVsWzvxsxO2jhjyaTg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
