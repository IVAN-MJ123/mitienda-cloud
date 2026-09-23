import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

// Contexto global: usuario autenticado + datos de licencia (límites Básica/Premium)
const AuthContext = createContext(null)

const LIMITES = {
  basica: { productos: 100, clientes: 50 },
  premium: { productos: Infinity, clientes: Infinity }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null) // fila de la tabla "usuarios"
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setCargando(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setPerfil(null); return }
    supabase.from('usuarios').select('*').eq('id', user.id).single()
      .then(({ data }) => setPerfil(data))
  }, [user])

  async function registrarse(email, password, nombreNegocio) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // Al registrarse se le asigna automáticamente la licencia "basica"
    await supabase.from('usuarios').insert({
      id: data.user.id,
      email,
      nombre_negocio: nombreNegocio,
      licencia: 'basica'
    })
    return data
  }

  async function iniciarSesion(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  const limites = LIMITES[perfil?.licencia ?? 'basica']

  return (
    <AuthContext.Provider value={{ user, perfil, limites, cargando, registrarse, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
