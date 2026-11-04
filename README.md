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

Antes de iniciar, edita `.env`: establece un `JWT_SECRET` aleatorio y largo, y cambia `SUPER_ADMIN_PASSWORD`. El archivo `.env` no se versiona.

## Desarrollo

Inicia el servidor y el cliente en modo desarrollo:

```bash
npm run dev
```

El cliente estará disponible en `http://localhost:5173` y la API en `http://localhost:3000`. Para comprobar el estado de la API, visita `http://localhost:3000/api/health`.

En el primer uso, crea el esquema de base de datos y el superadministrador:

```bash
npm run seed
```

El comando también crea agencias y reportes de demostración si la base de datos aún no contiene agencias. Úsalo solo en desarrollo; el código incluye credenciales predecibles para las cuentas de demostración. La cuenta de superadministrador usa los valores `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL` y `SUPER_ADMIN_PASSWORD` de `.env`.

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

## Estructura

```text
client/   Aplicación React y configuración de Vite
server/   API Express, autenticación, migraciones y pruebas
```

La base de datos y las fotografías se guardan localmente y están excluidas de Git.