# MiTienda Cloud 🏪

Plataforma web (PWA) para digitalizar inventario, ventas y fiados de tiendas de barrio.
100% open source y gratuita: React + Vite + Tailwind + Supabase + Vercel.

## 🎨 Diseño

Interfaz de escritorio con barra lateral fija (no un layout de app móvil), paleta
clara inspirada en las tiendas del Caribe colombiano — marfil, teal y mango — con
tipografía Fraunces (titulares) y Manrope (cuerpo). En pantallas angostas, la barra
lateral se convierte en pestañas superiores con scroll.

## 📁 Qué incluye este scaffold

- Autenticación (registro/login) con licencia "básica" automática (100 productos, 50 clientes)
- Dashboard tipo panel con ventas del día, total fiado y alertas de bajo stock
- Inventario en tabla con búsqueda, alta, edición y **eliminación** de productos (manual o por escáner)
- Escáner de código de barras con la cámara del celular (`html5-qrcode`)
- Ventas en vista de punto de venta: catálogo + carrito lado a lado, pago en efectivo o fiado
- Módulo de clientes/fiados con registro de abonos
- Informes con gráfico de ventas semanales, productos más vendidos y **exportación a Excel** (`xlsx`)
- PWA: funciona offline y se instala como app nativa

## 🚀 Paso a paso para desplegar (gratis)

### 1. Crear el proyecto en Supabase (base de datos)
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratis.
2. Crea un nuevo proyecto (elige la región más cercana, ej. `us-east-1`).
3. En el panel, ve a **SQL Editor** → **New query**.
4. Copia y pega todo el contenido de `supabase/schema.sql` y ejecuta (**Run**).
5. Ve a **Settings → API** y copia:
   - `Project URL` → será tu `VITE_SUPABASE_URL`
   - `anon public key` → será tu `VITE_SUPABASE_ANON_KEY`

### 2. Configurar el proyecto localmente
```bash
npm install
cp .env.example .env
# Pega tus valores de Supabase en el archivo .env
npm run dev
```
Abre `http://localhost:5173` en tu navegador (usa Chrome en el celular para probar la cámara).

### 3. Subir el código a GitHub
```bash
git init
git add .
git commit -m "MiTienda Cloud - versión inicial"
# Crea un repositorio nuevo en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/mitienda-cloud.git
git push -u origin main
```

### 4. Desplegar en Vercel (gratis)
1. Ve a [vercel.com](https://vercel.com) y entra con tu cuenta de GitHub.
2. Clic en **Add New → Project** y selecciona el repositorio `mitienda-cloud`.
3. En **Environment Variables**, agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clic en **Deploy**. En 1-2 minutos tendrás tu URL pública (ej. `mitienda-cloud.vercel.app`).

### 5. Instalar como app en el celular
Desde Chrome (Android) o Safari (iPhone), abre la URL de Vercel y selecciona
**"Agregar a pantalla de inicio"**. La app quedará instalada como si fuera nativa.

## 🔒 Sobre el escáner de código de barras
El navegador solo permite acceso a la cámara en sitios **HTTPS** (Vercel ya lo da gratis)
o en `localhost` durante desarrollo. Si pruebas desde otro celular en tu red local,
necesitarás HTTPS incluso en desarrollo (puedes usar `ngrok` como alternativa gratuita).

## 📌 Próximos pasos sugeridos
- Agregar edición y eliminación de productos/clientes
- Historial detallado de compras por cliente
- Exportar informes a PDF/Excel
- Roles de usuario (dueño / empleado) si el negocio tiene varios encargados
- Lógica de bloqueo cuando se alcanza el límite de la licencia básica y flujo de upgrade a Premium

## 🛠️ Stack usado (100% gratuito)
React 18 · Vite · Tailwind CSS · React Router · Supabase (Postgres + Auth) ·
html5-qrcode · Recharts · Lucide Icons · Vercel (hosting) · vite-plugin-pwa
