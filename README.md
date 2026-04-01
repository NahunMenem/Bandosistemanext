# Rodeo Calzados — Next.js

Sistema de gestión de créditos y ventas.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (ORM) + **PostgreSQL**
- **NextAuth.js** (autenticación con JWT)
- **xlsx** (exportar Excel)
- **jsPDF + jspdf-autotable** (exportar PDF)
- **Lucide React** (iconos)

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/rodeo_calzados"
NEXTAUTH_SECRET="una-clave-secreta-larga-y-aleatoria"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Crear la base de datos y aplicar el schema

```bash
npx prisma db push
npx prisma generate
```

### 4. Crear usuario inicial

```bash
npm run db:seed
```

Esto crea el usuario `admin` con contraseña `admin123`. **Cambiarla en producción.**

### 5. Correr en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (dashboard)/          # Páginas protegidas con Navbar
│   │   ├── page.tsx          # Clientes
│   │   ├── ventas/           # Nueva venta
│   │   ├── movimientos/      # Historial por cliente
│   │   ├── caja/             # Reporte de caja
│   │   ├── morosos/          # Clientes con deuda (+ export Excel/PDF)
│   │   ├── pagos/            # Registrar pago
│   │   └── editar/[id]/      # Editar cliente
│   ├── comprobante/[id]/     # Comprobante de venta (imprimible)
│   ├── comprobante-pago/[id]/# Comprobante de pago (imprimible)
│   ├── login/                # Login
│   └── api/                  # API Routes
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── auth.ts               # NextAuth config
│   └── prisma.ts             # Prisma client
└── types/
    └── index.ts
```

## Exportación en Clientes Morosos

En la página `/morosos` hay dos botones de exportación:

- **Descargar Excel** — genera un `.xlsx` con la lista completa de morosos y el total
- **Descargar PDF** — genera un `.pdf` con encabezado de la empresa, tabla de morosos y total

Ambas librerías se cargan de forma dinámica (lazy import) para no afectar el bundle inicial.
