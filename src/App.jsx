import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Sidebar from './components/Sidebar'
import TopBarMovil from './components/TopBarMovil'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Clientes from './pages/Clientes'
import Informes from './pages/Informes'

function RutaPrivada({ children }) {
  const { user, cargando } = useAuth()
  if (cargando) return <div className="p-8 text-center text-inkmuted">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-cream md:flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBarMovil />
        <main className="max-w-6xl mx-auto px-4 md:px-10 py-8">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RutaPrivada><Layout><Dashboard /></Layout></RutaPrivada>} />
        <Route path="/inventario" element={<RutaPrivada><Layout><Inventario /></Layout></RutaPrivada>} />
        <Route path="/ventas" element={<RutaPrivada><Layout><Ventas /></Layout></RutaPrivada>} />
        <Route path="/clientes" element={<RutaPrivada><Layout><Clientes /></Layout></RutaPrivada>} />
        <Route path="/informes" element={<RutaPrivada><Layout><Informes /></Layout></RutaPrivada>} />
      </Routes>
    </AuthProvider>
  )
}
