# Packange Reportery

Sistema web de reportería para operaciones de paquetería con separación por agencias. Permite registrar y dar seguimiento a reportes, consultar su estado y administrar usuarios según su rol.

## Funcionalidades

- Panel con resumen de reportes por estado.
- Gestión de agencias y usuarios con roles de superadministrador, administrador de agencia y empleado.
- Registro, consulta y seguimiento de reportes por número de rastreo.
- Estados de reporte: pendiente, procesado y cerrado.
- Fotografías adjuntas a los reportes.
- API protegida con autenticación JWT y base de datos SQLite.

## Requisitos

- Node.js 20.19 o posterior (o 22.12 o posterior).
- npm.

## Instalación

Instala las dependencias de la aplicación, el cliente y el servidor:

```bash
npm ci
npm ci --prefix client
npm ci --prefix server
```

Crea el archivo local de configuración a partir de la plantilla:

```bash
cp .env.example .env
```

Antes de iniciar, edita `.env`: establece un `JWT_SECRET` aleatorio y largo, indica el correo de `SUPER_ADMIN_EMAIL` y configura `SUPER_ADMIN_PASSWORD` con al menos 12 caracteres. El archivo `.env` no se versiona.

## Desarrollo

Inicia el servidor y el cliente en modo desarrollo:

```bash
npm run dev
```

El cliente estará disponible en `http://localhost:5173` y la API en `http://localhost:3000`. Para comprobar el estado de la API, visita `http://localhost:3000/api/health`.

En el primer uso, crea el esquema de base de datos y el superadministrador configurado en `.env`:

```bash
npm run seed
```

El comando no crea datos de demostración de forma predeterminada. El superadministrador se crea solo si todavía no existe; cambiar las variables de `.env` después no modifica la cuenta. Para cambiar su correo o contraseña, inicia sesión y edita el usuario desde la administración.

En desarrollo, puedes optar por crear agencias y reportes de ejemplo configurando `SEED_DEMO_DATA=true` y `DEMO_AGENCY_PASSWORD` (mínimo 12 caracteres) en `.env` antes de ejecutar el seed. Esta opción está bloqueada en producción.

## Roles

- **Superadministrador:** administra agencias y usuarios y puede consultar reportes de todas las agencias.
- **Administrador de agencia:** administra usuarios y reportes dentro de su propia agencia; no puede crear superadministradores ni acceder a otras agencias.
- **Empleado de agencia:** trabaja con reportes de su agencia, sin acceso a la administración de agencias o usuarios.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia API y cliente para desarrollo. |
| `npm run dev:server` | Inicia solo la API con recarga al cambiar archivos. |
| `npm run dev:client` | Inicia solo el cliente de Vite. |
| `npm run migrate` | Aplica las migraciones de SQLite. |
| `npm run seed` | Crea el superadministrador y, si corresponde, datos de demostración. |
| `npm test` | Ejecuta las pruebas del servidor. |
| `npm run build` | Genera el cliente de producción en `client/dist`. |
| `npm start` | Inicia el servidor; sirve el cliente compilado si existe `client/dist`. |

Para servir la aplicación compilada, ejecuta `npm run build` y después `npm start`.

## Configuración

Las variables principales de `.env` son:

| Variable | Propósito |
| --- | --- |
| `PORT` | Puerto HTTP del servidor (por defecto `3000`). |
| `NODE_ENV` | Entorno de ejecución (`development`, `test` o `production`). |
| `JWT_SECRET` | Secreto para firmar tokens; obligatorio en producción. |
| `JWT_EXPIRES_IN` | Vigencia de los tokens (por defecto `8h`). |
| `BCRYPT_ROUNDS` | Factor de costo para el hash de contraseñas. |
| `DB_PATH` | Ruta de la base SQLite (por defecto `./server/data/app.db`). |
| `UPLOAD_DIR` | Directorio para fotografías (por defecto `./server/uploads`). |
| `MAX_UPLOAD_BYTES` | Tamaño máximo por archivo (por defecto 5 MiB). |
| `CLIENT_ORIGIN` | Origen permitido para CORS (por defecto `http://localhost:5173`). |
| `SUPER_ADMIN_NAME` | Nombre inicial del superadministrador. |
| `SUPER_ADMIN_EMAIL` | Correo inicial del superadministrador. |
| `SUPER_ADMIN_PASSWORD` | Contraseña inicial del superadministrador. |
| `SEED_DEMO_DATA` | Activa la creación de datos demo en desarrollo (por defecto `false`; prohibido en producción). |
| `DEMO_AGENCY_PASSWORD` | Contraseña para las cuentas demo (mínimo 12 caracteres cuando se activan). |

## Estructura

```text
client/   Aplicación React y configuración de Vite
server/   API Express, autenticación, migraciones y pruebas
```

La base de datos y las fotografías se guardan localmente y están excluidas de Git.