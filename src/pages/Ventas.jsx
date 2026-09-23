import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Scanner from '../components/Scanner'
import { ScanLine, Trash2, Plus, Minus } from 'lucide-react'

export default function Ventas() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [mostrarScanner, setMostrarScanner] = useState(params.get('escanear') === '1')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [clienteId, setClienteId] = useState('')
  const [clientes, setClientes] = useState([])

  useEffect(() => {
    if (!user) return
    supabase.from('productos').select('*').eq('usuario_id', user.id).then(({ data }) => setProductos(data || []))
    supabase.from('clientes').select('*').eq('usuario_id', user.id).then(({ data }) => setClientes(data || []))
  }, [user])

  function agregarAlCarrito(producto) {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.producto_id === producto.id)
      if (existe) return prev.map((i) => i.producto_id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { producto_id: producto.id, nombre: producto.nombre, precio: Number(producto.precio), cantidad: 1 }]
    })
  }

  function cambiarCantidad(id, delta) {
    setCarrito((prev) => prev
      .map((i) => i.producto_id === id ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter((i) => i.cantidad > 0))
  }

  function manejarCodigoDetectado(codigo) {
    setMostrarScanner(false)
    setParams({})
    const producto = productos.find((p) => p.codigo_barras === codigo)
    if (producto) agregarAlCarrito(producto)
    else alert('Producto no encontrado. Agrégalo primero desde Inventario.')
  }

  const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const filtrados = productos.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))

  async function confirmarVenta() {
    if (carrito.length === 0) return
    if (metodoPago === 'fiado' && !clienteId) { alert('Selecciona un cliente para la venta fiada'); return }

    const { data: venta, error } = await supabase.from('ventas').insert({
      usuario_id: user.id, total, metodo_pago: metodoPago,
      cliente_id: metodoPago === 'fiado' ? clienteId : null
    }).select().single()
    if (error) { alert('Error al registrar venta: ' + error.message); return }

    await supabase.from('detalle_ventas').insert(
      carrito.map((i) => ({ venta_id: venta.id, producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio }))
    )
    for (const item of carrito) {
      const producto = productos.find((p) => p.id === item.producto_id)
      if (producto) await supabase.from('productos').update({ stock: producto.stock - item.cantidad }).eq('id', producto.id)
    }
    if (metodoPago === 'fiado') await supabase.rpc('incrementar_fiado', { p_cliente_id: clienteId, p_monto: total })

    setCarrito([])
    alert('¡Venta registrada!')
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl text-ink">Registrar venta</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Catálogo */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex gap-2">
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..."
              className="flex-1 bg-surface border border-teal-light rounded-xl px-4 py-2.5" />
            <button onClick={() => setMostrarScanner(true)}
              className="flex items-center gap-2 bg-mango text-white font-semibold rounded-xl px-4">
              <ScanLine size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtrados.map((p) => (
              <button key={p.id} onClick={() => agregarAlCarrito(p)}
                className="bg-surface border border-teal-light rounded-2xl p-4 text-left hover:border-teal transition-colors">
                <p className="font-semibold text-ink text-sm">{p.nombre}</p>
                <p className="text-teal-dark font-bold mt-1">${Number(p.precio).toLocaleString('es-CO')}</p>
                <p className="text-xs text-inkmuted">Stock: {p.stock}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-3xl border border-teal-light p-5 sticky top-24 space-y-4">
            <h2 className="font-display text-xl text-ink">Carrito</h2>
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {carrito.map((i) => (
                <li key={i.producto_id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{i.nombre}</p>
                    <p className="text-xs text-inkmuted">${i.precio.toLocaleString('es-CO')} c/u</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => cambiarCantidad(i.producto_id, -1)} className="p-1.5 rounded-lg bg-cream"><Minus size={14} /></button>
                    <span className="w-6 text-center font-semibold">{i.cantidad}</span>
                    <button onClick={() => cambiarCantidad(i.producto_id, 1)} className="p-1.5 rounded-lg bg-cream"><Plus size={14} /></button>
                    <button onClick={() => cambiarCantidad(i.producto_id, -i.cantidad)} className="p-1.5 rounded-lg text-mango-dark"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
              {carrito.length === 0 && <p className="text-inkmuted text-sm py-4 text-center">Agrega productos del catálogo</p>}
            </ul>

            {carrito.length > 0 && (
              <>
                <div className="flex justify-between items-baseline pt-2 border-t border-teal-light">
                  <span className="font-semibold text-ink">Total</span>
                  <span className="font-display text-3xl text-teal-dark">${total.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setMetodoPago('efectivo')}
                    className={`flex-1 py-2 rounded-xl font-semibold text-sm ${metodoPago === 'efectivo' ? 'bg-teal text-white' : 'bg-cream text-inkmuted'}`}>
                    Efectivo
                  </button>
                  <button onClick={() => setMetodoPago('fiado')}
                    className={`flex-1 py-2 rounded-xl font-semibold text-sm ${metodoPago === 'fiado' ? 'bg-mango text-white' : 'bg-cream text-inkmuted'}`}>
                    Fiado
                  </button>
                </div>
                {metodoPago === 'fiado' && (
                  <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}
                    className="w-full border border-teal-light rounded-xl px-4 py-2.5">
                    <option value="">Selecciona un cliente</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                )}
                <button onClick={confirmarVenta} className="w-full bg-ink text-white font-bold rounded-xl py-3">
                  Confirmar venta
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {mostrarScanner && <Scanner onDetectado={manejarCodigoDetectado} onCerrar={() => { setMostrarScanner(false); setParams({}) }} />}
    </div>
  )
}
