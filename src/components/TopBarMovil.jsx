import { NavLink } from 'react-router-dom'
import { LayoutGrid, Package, ShoppingBasket, Users, PieChart } from 'lucide-react'

// En pantallas angostas, un selector de pestañas horizontal con scroll —
// no una barra flotante tipo app nativa.
const ITEMS = [
  { to: '/', label: 'Panel', icon: LayoutGrid, fin: true },
  { to: '/inventario', label: 'Inventario', icon: Package },
  { to: '/ventas', label: 'Ventas', icon: ShoppingBasket },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/informes', label: 'Informes', icon: PieChart }
]

export default function TopBarMovil() {
  return (
    <nav className="md:hidden sticky top-0 z-30 bg-teal text-white overflow-x-auto">
      <div className="flex gap-1 px-3 py-2 min-w-max">
        {ITEMS.map(({ to, label, icon: Icon, fin }) => (
          <NavLink
            key={to} to={to} end={fin}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
                isActive ? 'bg-white text-teal-dark' : 'text-white/80'
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
