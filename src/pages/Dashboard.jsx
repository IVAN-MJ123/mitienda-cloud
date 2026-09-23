import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { HandCoins, AlertTriangle, TrendingUp, Trash2, LogOut } from 'lucide-react'

export default function Dashboard() {
  const { perfil, user, signOut, cerrarSesion } = useAuth()
  const [ventasHoy, setVentasHoy] = useState(0)
  const [numVentasHoy, setNumVentasHoy] = useState(0)
  const [totalFiado, setTotalFiado] = useState(0)
  const [bajoStock, setBajoStock] = useState([])
  const [cargando, setCargando] = useState(true)
  const [reiniciando, setReiniciando] = useState(false)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    if (!user) return
    async function cargarDatos() {
      const hoyInicio = new Date(); hoyInicio.setHours(0, 0, 0, 0)
      const [{ data: ventas }, { data: fiados }, { data: productos }] = await Promise.all([
        supabase.from('ventas').select('total').eq('usuario_id', user.id).gte('fecha', hoyInicio.toISOString()),
        supabase.from('fiados').select('saldo_pendiente').eq('usuario_id', user.id).gt('saldo_pendiente', 0),
        supabase.from('productos').select('id, nombre, stock').eq('usuario_id', user.id).lte('stock', 5)
      ])
      setVentasHoy((ventas || []).reduce((acc, v) => acc + Number(v.total), 0))
      setNumVentasHoy((ventas || []).length)
      setTotalFiado((fiados || []).reduce((acc, f) => acc + Number(f.saldo_pendiente), 0))
      setBajoStock(productos || [])
      setCargando(false)
    }
    cargarDatos()
  }, [user])

  const cop = (n) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

  // Función para cerrar la sesión actual
  const handleCerrarSesion = async () => {
    try {
      setSaliendo(true)
      if (signOut) {
        await signOut()
      } else if (cerrarSesion) {
        await cerrarSesion()
      } else {
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err)
      alert('Hubo un problema al cerrar sesión')
    } finally {
      setSaliendo(false)
    }
  }

  // Función para reiniciar todos los registros de la tienda
  const handleReiniciarTodo = async () => {
    const confirmacion = window.prompt(
      "⚠️ ATENCIÓN:\nEsta acción eliminará definitivamente tus productos, clientes, fiados y ventas.\n\nEscribe BORRAR (en mayúsculas) para confirmar:"
    )

    if (confirmacion !== 'BORRAR') {
      if (confirmacion !== null) alert("Operación cancelada. El texto no coincidió.")
      return
    }

    setReiniciando(true)
    try {
      await supabase.from('abonos').delete().eq('usuario_id', user.id)
      await supabase.from('ventas').delete().eq('usuario_id', user.id)
      await supabase.from('fiados').delete().eq('usuario_id', user.id)
      await supabase.from('clientes').delete().eq('usuario_id', user.id)
      await supabase.from('productos').delete().eq('usuario_id', user.id)

      alert("✓ Datos eliminados correctamente. La tienda está limpia.")
      window.location.reload()
    } catch (err) {
      console.error("Error al reiniciar datos:", err)
      alert("Ocurrió un problema al borrar los datos: " + (err.message || "Error de conexión"))
    } finally {
      setReiniciando(false)
    }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Encabezado con bienvenida y botón para cerrar sesión */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-inkmuted font-medium">Hola, {perfil?.nombre_negocio || 'bienvenido'}</p>
          <h1 className="font-display text-3xl text-ink mt-1">Así va tu negocio hoy</h1>
        </div>

        <button
          type="button"
          disabled={saliendo}
          onClick={handleCerrarSesion}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface border border-slate-200 text-inkmuted hover:text-red-600 hover:border-red-200 active:scale-95 text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          <span>{saliendo ? 'Saliendo...' : 'Cerrar sesión'}</span>
        </button>
      </div>

      {/* Bento: una tarjeta hero grande + dos tarjetas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-teal text-white rounded-[2rem] p-8 relative overflow-hidden">
          <div className="flex items-center gap-2 text-white/80 text-sm font-semibold">
            <TrendingUp size={17} /> Ventas de hoy
          </div>
          <p className="font-display text-6xl mt-3">{cargando ? '—' : cop(ventasHoy)}</p>
          <p className="text-white/70 text-sm mt-3">{numVentasHoy} venta{numVentasHoy === 1 ? '' : 's'} registrada{numVentasHoy === 1 ? '' : 's'} hoy</p>
          <div className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute right-16 -bottom-16 w-28 h-28 rounded-full bg-white/10" />
        </div>

        <div className="bg-mango-light rounded-[2rem] p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-mango-dark text-sm font-semibold">
            <HandCoins size={17} /> Total fiado
          </div>
          <p className="font-display text-4xl text-ink mt-2">{cargando ? '—' : cop(totalFiado)}</p>
          <p className="text-inkmuted text-sm mt-1">pendiente por cobrar</p>
        </div>
      </div>

      <div className="text-teal borde-toldo" />

      {/* Alerta de bajo stock */}
      <div className="bg-surface rounded-3xl p-6 border border-teal-light">
        <div className="flex items-center gap-2 text-mango font-semibold mb-4">
          <AlertTriangle size={18} /> Bajo stock ({bajoStock.length})
        </div>
        {bajoStock.length === 0 && !cargando && (
          <p className="text-inkmuted">Todo tu inventario está en buen nivel.</p>
        )}
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {bajoStock.map((p) => (
            <li key={p.id} className="flex justify-between items-center bg-sun-light rounded-xl px-4 py-3">
              <span className="font-medium text-ink">{p.nombre}</span>
              <span className="font-bold text-mango-dark">{p.stock} und.</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tarjeta visible para limpiar datos y empezar de cero */}
      <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-red-700 flex items-center gap-2">
            <Trash2 size={18} /> Empezar de cero
          </p>
          <p className="text-xs sm:text-sm text-inkmuted mt-0.5">
            Elimina productos, clientes, fiados y ventas si estabas haciendo pruebas.
          </p>
        </div>

        <button
          type="button"
          disabled={reiniciando}
          onClick={handleReiniciarTodo}
          className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          {reiniciando ? 'Limpiando...' : 'Borrar datos de prueba'}
        </button>
      </div>
    </div>
  )
}