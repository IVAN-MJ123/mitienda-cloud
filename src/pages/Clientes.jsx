import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { Plus, UserRound, Trash2, Phone } from 'lucide-react'

export default function Clientes() {
  const { user, limites } = useAuth()
  const [clientes, setClientes] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [montoAbono, setMontoAbono] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', telefono: '' })

  useEffect(() => { 
    cargarClientes() 
  }, [user])

  async function cargarClientes() {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('saldo_pendiente', { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      console.error("Error al cargar clientes:", err)
    }
  }

  async function crearCliente(e) {
    e.preventDefault()
    if (limites?.clientes && clientes.length >= limites.clientes) {
      alert(`Alcanzaste el límite de ${limites.clientes} clientes de tu licencia. Actualiza a Premium.`)
      return
    }

    if (!nuevoCliente.nombre.trim()) {
      alert("Por favor escribe el nombre del cliente.")
      return
    }

    setGuardando(true)
    try {
      const { error } = await supabase.from('clientes').insert({ 
        usuario_id: user.id, 
        nombre: nuevoCliente.nombre.trim(), 
        telefono: nuevoCliente.telefono.trim(), 
        saldo_pendiente: 0 
      })

      if (error) throw error

      setMostrarForm(false)
      setNuevoCliente({ nombre: '', telefono: '' })
      await cargarClientes()
    } catch (err) {
      console.error("Error al crear cliente:", err)
      alert("No se pudo guardar el cliente: " + (err.message || "Revisa la conexión."))
    } finally {
      setGuardando(false)
    }
  }

  async function registrarAbono() {
    if (!montoAbono || !seleccionado) return
    const monto = Number(montoAbono)

    if (isNaN(monto) || monto <= 0) {
      alert("Por favor ingresa un monto válido mayor a 0.")
      return
    }

    setGuardando(true)
    try {
      // 1. Registrar abono en historial
      const { error: errAbono } = await supabase.from('abonos').insert({ 
        cliente_id: seleccionado.id, 
        usuario_id: user.id, 
        monto 
      })
      if (errAbono) throw errAbono

      // 2. Actualizar saldo del cliente
      const nuevoSaldo = Math.max(0, Number(seleccionado.saldo_pendiente) - monto)
      const { error: errCliente } = await supabase
        .from('clientes')
        .update({ saldo_pendiente: nuevoSaldo })
        .eq('id', seleccionado.id)

      if (errCliente) throw errCliente

      setMontoAbono('')
      setSeleccionado(null)
      await cargarClientes()
    } catch (err) {
      console.error("Error al registrar abono:", err)
      alert("Error al registrar el abono: " + (err.message || "Intenta de nuevo."))
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarCliente(cliente) {
    let advertencia = `¿Deseas eliminar a "${cliente.nombre}"?`
    
    // Alerta preventiva estricta si existe deuda pendiente
    if (Number(cliente.saldo_pendiente) > 0) {
      advertencia = `⚠️ ¡ATENCIÓN!\n\n${cliente.nombre} tiene una deuda pendiente de $${Number(cliente.saldo_pendiente).toLocaleString('es-CO')}.\n\nSi eliminas este cliente, se perderá el registro de su fiado. ¿Estás seguro de eliminarlo?`
    }

    if (!window.confirm(advertencia)) return

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', cliente.id)

      if (error) throw error

      if (seleccionado?.id === cliente.id) {
        setSeleccionado(null)
      }

      await cargarClientes()
    } catch (err) {
      console.error("Error al eliminar cliente:", err)
      alert("No se pudo eliminar el cliente: " + (err.message || "Error al procesar en el servidor."))
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl text-ink">Clientes y fiados</h1>
        <button 
          onClick={() => setMostrarForm(true)}
          className="flex items-center gap-2 bg-mango text-white font-semibold rounded-xl px-4 py-2.5 shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      {/* Lista / Cuadrícula de Clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clientes.map((c) => (
          <div 
            key={c.id} 
            onClick={() => setSeleccionado(c)}
            className="bg-surface rounded-2xl p-4 border border-teal-light text-left hover:border-teal transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-teal-light p-2.5 rounded-full shrink-0">
                <UserRound size={20} className="text-teal-dark" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink truncate">{c.nombre}</p>
                <p className={`text-sm font-bold ${Number(c.saldo_pendiente) > 0 ? 'text-mango-dark' : 'text-inkmuted'}`}>
                  ${Number(c.saldo_pendiente).toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            {/* Botón rápido de eliminar en la tarjeta */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation() // No abre el modal de abono al hacer clic aquí
                eliminarCliente(c)
              }}
              className="p-2 text-inkmuted hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
              title="Eliminar cliente"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {clientes.length === 0 && (
          <div className="col-span-full text-center py-12 bg-surface rounded-2xl border border-dashed border-teal-light">
            <p className="text-inkmuted font-medium">No tienes clientes registrados todavía.</p>
            <p className="text-xs text-inkmuted mt-1">Usa el botón "Nuevo cliente" para comenzar.</p>
          </div>
        )}
      </div>

      {/* Modal: Nuevo Cliente */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <form onSubmit={crearCliente} className="bg-surface w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-xl">
            <h2 className="font-display text-2xl text-ink">Nuevo cliente</h2>
            <div className="space-y-3">
              <input 
                required 
                placeholder="Nombre del cliente" 
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                className="w-full border border-teal-light rounded-xl px-4 py-3 outline-none focus:border-teal" 
              />
              <input 
                type="tel"
                placeholder="Teléfono o WhatsApp (opcional)" 
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                className="w-full border border-teal-light rounded-xl px-4 py-3 outline-none focus:border-teal" 
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                disabled={guardando}
                onClick={() => setMostrarForm(false)} 
                className="flex-1 py-3 rounded-xl bg-cream font-semibold text-ink active:scale-95 transition-transform"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={guardando}
                className="flex-1 py-3 rounded-xl bg-teal text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Detalle del Cliente y Abono */}
      {seleccionado && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-xl">
            <div>
              <h2 className="font-display text-2xl text-ink truncate">{seleccionado.nombre}</h2>
              {seleccionado.telefono && (
                <p className="text-xs text-inkmuted flex items-center gap-1 mt-0.5">
                  <Phone size={13} /> {seleccionado.telefono}
                </p>
              )}
            </div>

            <div className="bg-cream/60 p-4 rounded-2xl">
              <p className="text-xs text-inkmuted font-medium">Deuda actual (Fiado):</p>
              <p className="text-2xl font-bold text-mango-dark mt-0.5">
                ${Number(seleccionado.saldo_pendiente).toLocaleString('es-CO')}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink">Registrar Abono a la Deuda</label>
              <input 
                type="number" 
                placeholder="¿Cuánto va a abonar? ($)" 
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
                className="w-full border border-teal-light rounded-xl px-4 py-3 outline-none focus:border-teal font-semibold text-ink" 
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button 
                type="button"
                disabled={guardando}
                onClick={() => setSeleccionado(null)} 
                className="flex-1 py-3 rounded-xl bg-cream font-semibold text-ink active:scale-95 transition-transform"
              >
                Cerrar
              </button>
              <button 
                type="button"
                disabled={guardando || !montoAbono}
                onClick={registrarAbono} 
                className="flex-1 py-3 rounded-xl bg-teal text-white font-semibold active:scale-95 transition-transform disabled:opacity-50"
              >
                {guardando ? 'Abonando...' : 'Abonar'}
              </button>
            </div>

            {/* Acción secundaria de eliminación segura dentro del modal */}
            <div className="pt-2 border-t border-teal-light/50 text-center">
              <button
                type="button"
                disabled={guardando}
                onClick={() => eliminarCliente(seleccionado)}
                className="text-xs text-red-500 hover:text-red-700 font-semibold py-1 px-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                Eliminar este cliente definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}