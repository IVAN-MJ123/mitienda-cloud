import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { FileSpreadsheet } from 'lucide-react'

export default function Informes() {
  const { user } = useAuth()
  const [ventasSemana, setVentasSemana] = useState([])
  const [masVendidos, setMasVendidos] = useState([])
  const [ventasDetalle, setVentasDetalle] = useState([])
  const [productos, setProductos] = useState([])

  useEffect(() => {
    if (!user) return
    cargarVentasSemana()
    cargarMasVendidos()
    cargarDatosExportacion()
  }, [user])

  async function cargarVentasSemana() {
    const hace7dias = new Date(); hace7dias.setDate(hace7dias.getDate() - 7)
    const { data } = await supabase.from('ventas').select('total, fecha').eq('usuario_id', user.id).gte('fecha', hace7dias.toISOString())
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const acumulado = {}
    ;(data || []).forEach((v) => {
      const dia = dias[new Date(v.fecha).getDay()]
      acumulado[dia] = (acumulado[dia] || 0) + Number(v.total)
    })
    setVentasSemana(dias.map((d) => ({ dia: d, total: acumulado[d] || 0 })))
  }

  async function cargarMasVendidos() {
    const { data } = await supabase.from('vista_productos_mas_vendidos').select('*').eq('usuario_id', user.id).limit(5)
    setMasVendidos(data || [])
  }

  async function cargarDatosExportacion() {
    const { data: ventas } = await supabase.from('ventas').select('fecha, total, metodo_pago').eq('usuario_id', user.id).order('fecha', { ascending: false })
    setVentasDetalle(ventas || [])
    const { data: prods } = await supabase.from('productos').select('nombre, unidad, precio, costo, stock').eq('usuario_id', user.id)
    setProductos(prods || [])
  }

  // Exporta ventas, inventario y más vendidos a un solo archivo .xlsx con varias hojas
  function exportarExcel() {
    const libro = XLSX.utils.book_new()

    const hojaVentas = XLSX.utils.json_to_sheet(ventasDetalle.map((v) => ({
      Fecha: new Date(v.fecha).toLocaleString('es-CO'),
      Total: v.total,
      'Método de pago': v.metodo_pago === 'fiado' ? 'Fiado' : 'Efectivo'
    })))
    XLSX.utils.book_append_sheet(libro, hojaVentas, 'Ventas')

    const hojaInventario = XLSX.utils.json_to_sheet(productos.map((p) => ({
      Producto: p.nombre, Unidad: p.unidad, Precio: p.precio, Costo: p.costo, Stock: p.stock
    })))
    XLSX.utils.book_append_sheet(libro, hojaInventario, 'Inventario')

    const hojaMasVendidos = XLSX.utils.json_to_sheet(masVendidos.map((p) => ({
      Producto: p.nombre, 'Cantidad vendida': p.cantidad_vendida
    })))
    XLSX.utils.book_append_sheet(libro, hojaMasVendidos, 'Más vendidos')

    const fecha = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(libro, `mitienda-informe-${fecha}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-3xl text-ink">Informes</h1>
        <button onClick={exportarExcel}
          className="flex items-center gap-2 bg-teal text-white font-semibold rounded-xl px-4 py-2.5">
          <FileSpreadsheet size={18} /> Exportar a Excel
        </button>
      </div>

      <div className="bg-surface rounded-3xl p-6 border border-teal-light">
        <p className="font-display text-xl text-ink mb-4">Ventas de la semana</p>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={ventasSemana}>
              <XAxis dataKey="dia" fontSize={12} stroke="#6B7D7F" />
              <YAxis fontSize={12} stroke="#6B7D7F" />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString('es-CO')}`} />
              <Bar dataKey="total" fill="#0F8B8D" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-6 border border-teal-light">
        <p className="font-display text-xl text-ink mb-4">Productos más vendidos</p>
        <ul className="space-y-2">
          {masVendidos.map((p, idx) => (
            <li key={p.producto_id} className="flex justify-between items-center bg-sun-light rounded-xl px-4 py-3">
              <span className="font-medium text-ink">{idx + 1}. {p.nombre}</span>
              <span className="font-bold text-mango-dark">{p.cantidad_vendida} und.</span>
            </li>
          ))}
          {masVendidos.length === 0 && <p className="text-inkmuted">Aún no hay datos suficientes</p>}
        </ul>
      </div>
    </div>
  )
}
