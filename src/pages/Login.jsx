import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Store } from 'lucide-react'

export default function Login() {
  const { iniciarSesion, registrarse } = useAuth()
  const navigate = useNavigate()
  const [modoRegistro, setModoRegistro] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreNegocio, setNombreNegocio] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function manejarEnvio(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      if (modoRegistro) await registrarse(email, password, nombreNegocio)
      else await iniciarSesion(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-teal p-3 rounded-2xl mb-3">
            <Store size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl text-ink">MiTienda Cloud</h1>
          <p className="text-inkmuted text-sm mt-1">Gestiona tu negocio fácil</p>
        </div>

        <div className="bg-surface rounded-3xl border border-teal-light p-6">
          <form onSubmit={manejarEnvio} className="space-y-3">
            {modoRegistro && (
              <input type="text" placeholder="Nombre del negocio" value={nombreNegocio}
                onChange={(e) => setNombreNegocio(e.target.value)} required
                className="w-full rounded-xl border border-teal-light px-4 py-3 text-base" />
            )}
            <input type="email" placeholder="Correo electrónico" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-xl border border-teal-light px-4 py-3 text-base" />
            <input type="password" placeholder="Contraseña" value={password}
              onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full rounded-xl border border-teal-light px-4 py-3 text-base" />

            {error && <p className="text-mango-dark text-sm">{error}</p>}

            <button type="submit" disabled={cargando}
              className="w-full bg-mango text-white font-bold py-3 rounded-xl disabled:opacity-60">
              {cargando ? 'Cargando...' : modoRegistro ? 'Crear cuenta' : 'Ingresar'}
            </button>
          </form>

          <button onClick={() => setModoRegistro(!modoRegistro)}
            className="w-full text-center text-teal-dark text-sm font-semibold mt-4">
            {modoRegistro ? '¿Ya tienes cuenta? Ingresa' : '¿Eres nuevo? Regístrate gratis'}
          </button>
        </div>
      </div>
    </div>
  )
}
