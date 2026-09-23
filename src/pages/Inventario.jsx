import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Scanner from '../components/Scanner'
import { Search, Plus, ScanLine, Pencil, Trash2 } from 'lucide-react'

const UNIDADES = ['Unidad', 'Libra', 'Kilo', 'Caja']
const FORM_VACIO = { nombre: '', codigo_barras: '', precio: '', costo: '', stock: '', unidad: 'Unidad' }

export default function Inventario() {
  const { user, limites } = useAuth()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)

  useEffect(() => { cargarProductos() }, [user])

  async function cargarProductos() {
    if (!user) return
    const { data } = await supabase.from('productos').select('*').eq('usuario_id', user.id).order('nombre')
    setProductos(data || [])
  }

  function abrirFormNuevo(codigoDetectado = '') {
    setEditandoId(null)
    setForm({ ...FORM_VACIO, codigo_barras: codigoDetectado })
    setMostrarForm(true)
  }

  function abrirFormEditar(p) {
    setEditandoId(p.id)
    setForm({
      nombre: p.nombre, codigo_barras: p.codigo_barras || '',
      precio: p.precio, costo: p.costo, stock: p.stock, unidad: p.unidad
    })
    setMostrarForm(true)
  }

  async function manejarCodigoDetectado(codigo) {
    setMostrarScanner(false)
    const existente = productos.find((p) => p.codigo_barras === codigo)
    if (existente) abrirFormEditar(existente)
    else abrirFormNuevo(codigo)
  }

  async function guardarProducto(e) {
    e.preventDefault()
    if (!editandoId && productos.length >= limites.productos) {
      alert(`Alcanzaste el límite de ${limites.productos} productos de tu licencia. Actualiza a Premium.`)
      return
    }
    const payload = {
      nombre: form.nombre,
      codigo_barras: form.codigo_barras || null,
      precio: Number(form.precio),
      costo: Number(form.costo) || 0,
      stock: Number(form.stock),
      unidad: form.unidad
    }
    const { error } = editandoId
      ? await supabase.from('productos').update(payload).eq('id', editandoId)
      : await supabase.from('productos').insert({ ...payload, usuario_id: user.id })

    if (error) { alert('Error al guardar: ' + error.message); return }
    setMostrarForm(false)
    cargarProductos()
  }

  async function eliminarProducto(p) {
    if (!confirm(`¿Eliminar "${p.nombre}" del inventario? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.from('productos').delete().eq('id', p.id)
    if (error) { alert('Error al eliminar: ' + error.message); return }
    cargarProductos()
  }

  const filtrados = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl text-ink">Inventario</h1>
        <div className="flex gap-2">
          <button onClick={() => setMostrarScanner(true)}
            className="flex items-center gap-2 bg-teal-light text-teal-dark font-semibold rounded-xl px-4 py-2.5">
            <ScanLine size={18} /> Escanear
          </button>
          <button onClick={() => abrirFormNuevo()}
            className="flex items-center gap-2 bg-mango text-white font-semibold rounded-xl px-4 py-2.5">
            <Plus size={18} /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="flex items-center bg-surface border border-teal-light rounded-xl px-3 max-w-md">
        <Search size={18} className="text-inkmuted" />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar producto..." className="w-full py-2.5 px-2 outline-none text-base bg-transparent" />
      </div>

      <div className="bg-surface rounded-3xl border border-teal-light overflow-hidden">
        {/* Contenedor con scroll horizontal solo en móvil */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-inkmuted border-b border-teal-light">
                <th className="py-3 px-4 font-semibold">Producto</th>
                <th className="py-3 px-4 font-semibold">Unidad</th>
                <th className="py-3 px-4 font-semibold">Stock</th>
                <th className="py-3 px-4 font-semibold">Precio</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id} className="border-b border-teal-light/60 last:border-0 hover:bg-cream/60">
                  <td className="py-3 px-4 font-medium text-ink">{p.nombre}</td>
                  <td className="py-3 px-4 text-inkmuted">{p.unidad}</td>
                  <td className="py-3 px-4">
                    <span className={p.stock <= 5 ? 'text-mango-dark font-bold' : 'text-ink'}>{p.stock}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-teal-dark">${Number(p.precio).toLocaleString('es-CO')}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => abrirFormEditar(p)} className="p-2 rounded-lg hover:bg-teal-light text-teal-dark" aria-label="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => eliminarProducto(p)} className="p-2 rounded-lg hover:bg-mango-light text-mango-dark" aria-label="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && <p className="text-center text-inkmuted py-10">No hay productos aún</p>}
      </div>

      {mostrarScanner && <Scanner onDetectado={manejarCodigoDetectado} onCerrar={() => setMostrarScanner(false)} />}

      {mostrarForm && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
          <form onSubmit={guardarProducto} className="bg-surface w-full max-w-md rounded-3xl p-6 space-y-3">
            <h2 className="font-display text-2xl text-ink">{editandoId ? 'Editar producto' : 'Nuevo producto'}</h2>
            <input required placeholder="Nombre" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-teal-light rounded-xl px-4 py-3" />
            <input placeholder="Código de barras (opcional)" value={form.codigo_barras}
              onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
              className="w-full border border-teal-light rounded-xl px-4 py-3" />
            <div className="grid grid-cols-2 gap-2">
              <input required type="number" placeholder="Precio venta" value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
                className="border border-teal-light rounded-xl px-4 py-3" />
              <input type="number" placeholder="Costo" value={form.costo}
                onChange={(e) => setForm({ ...form, costo: e.target.value })}
                className="border border-teal-light rounded-xl px-4 py-3" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input required type="number" placeholder="Stock" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="border border-teal-light rounded-xl px-4 py-3" />
              <select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                className="border border-teal-light rounded-xl px-4 py-3">
                {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 py-3 rounded-xl bg-cream font-semibold text-ink">Cancelar</button>
              <button type="submit" className="flex-1 py-3 rounded-xl bg-teal text-white font-semibold">Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}