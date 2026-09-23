import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { LayoutGrid, Package, ShoppingBasket, Users, PieChart, LogOut, Store } from 'lucide-react'

// Barra lateral fija: navegación de escritorio, no una barra de app móvil.
const ITEMS = [
  { to: '/', label: 'Panel', icon: LayoutGrid, fin: true },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/ventas', label: 'Ventas', icon: ShoppingBasket },
  { to: '/clientes', label: 'Clientes y fiados', icon: Users },
  { to: '/informes', label: 'Informes', icon: PieChart }
]

export default function Sidebar() {
  const { perfil, cerrarSesion } = useAuth()

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-teal text-white min-h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 pt-8 pb-6">
        <div className="bg-white/15 p-2 rounded-xl"><Store size={22} /></div>
        <div>
          <p className="font-display text-lg leading-tight">MiTienda</p>
          <p className="text-xs text-white/70">{perfil?.nombre_negocio || 'Cloud'}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {ITEMS.map(({ to, label, icon: Icon, fin }) => (
          <NavLink
            key={to} to={to} end={fin}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-white text-teal-dark' : 'text-white/80 hover:bg-white/10'
              }`
            }
          >
            <Icon size={19} /> {label}
          </NavLink>
        ))}
      </nav>

      <button onClick={cerrarSesion} className="flex items-center gap-3 px-6 py-5 text-sm font-semibold text-white/70 hover:text-white">
        <LogOut size={18} /> Cerrar sesión
      </button>
    </aside>
  )
}
