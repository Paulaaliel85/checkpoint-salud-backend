# CheckPoint Salud B2B

Sistema web para la gestión de exámenes médicos laborales, turnos y aptos médicos. Permite administrar la información según el rol de cada usuario: **ADMIN, CLINICA, EMPRESA y PACIENTE**.

## Tecnologías utilizadas

**Backend**
- Node.js y Express 5.
- TypeScript.
- PostgreSQL.
- Prisma ORM.
- JWT para autenticación.
- Bcrypt para encriptar contraseñas.
- Joi para validar datos.
- Multer para la carga de archivos.
- Socket.IO para comunicación en tiempo real.

**Frontend**
- Vue 3 y TypeScript.
- Pinia para el estado global.
- Vue Router para la navegación.
- Tailwind CSS y Vite.

## Backend

El backend es el encargado de procesar las solicitudes del sistema, aplicar las reglas de negocio, validar la información, controlar los permisos y comunicarse con la base de datos.

Está desarrollado con Node.js, Express y TypeScript, utilizando una API REST para conectar el frontend con el servidor.

### Estructura principal

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── config/
│   ├── generated/
│   ├── lib/
│   ├── middlewares/
│   ├── routes/
│   ├── scripts/
│   ├── server.ts
│   └── socket.ts
├── uploads/
├── .env.example
├── package.json
└── prisma7.config.ts
```

### Base de datos

Se utiliza PostgreSQL junto con Prisma ORM para gestionar la información.

Los principales modelos son:
- Usuario
- Empresa
- Paciente
- PuestoRequisito
- Sede
- Turno
- AptoMedico
- SolicitudTurno

Prisma permite definir las relaciones entre las entidades y mantener el historial de cambios de la estructura de la base de datos mediante migraciones.

### Autenticación y seguridad

- JWT permite identificar a los usuarios mediante tokens.
- Bcrypt se utiliza para proteger las contraseñas.
- Los middlewares verifican la autenticación y los permisos según el rol.
- Joi valida los datos recibidos por el servidor.

### API y comunicación

La API está organizada por módulos para separar las responsabilidades de cada funcionalidad.

Los principales grupos de rutas son:

| Grupo | Funcionalidad |
|---|---|
| `/api` | Autenticación y operaciones generales |
| `/api/aptos` | Aptos médicos |
| `/api/turnos` | Turnos |
| `/api/usuarios` | Usuarios |
| `/api` | Operaciones de empresas y trabajadores |
| `/api` | Operaciones de pacientes |

Además, el servidor dispone de endpoints generales:

- `GET /`: comprueba que el backend esté funcionando.
- `GET /api/health`: verifica el estado del servidor y la conexión con PostgreSQL.
- `GET /api/clinica`: endpoint protegido para el rol CLINICA.
- `GET /api/admin`: endpoint protegido para el rol ADMIN.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/Paulaaliel85/checkpoint-salud-backend.git
```

### 2. Instalar dependencias del frontend

Desde la carpeta principal:

```bash
npm install
```

### 3. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 4. Configurar las variables de entorno

Dentro de `backend/`, crear un archivo `.env` tomando como referencia `.env.example`.

Ejemplo:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/checkpoint_salud

JWT_SECRET=una_clave_segura_de_al_menos_16_caracteres
JWT_EXPIRES_IN=1h
```

Reemplazar `TU_PASSWORD` por la contraseña configurada en PostgreSQL.

La variable `FRONTEND_URL` debe coincidir con la dirección del frontend.

**Importante:** el archivo `.env` contiene información privada y no debe subirse al repositorio.

### 5. Crear la base de datos

Desde PostgreSQL, crear una base de datos llamada:

```sql
CREATE DATABASE checkpoint_salud;
```

### 6. Generar el cliente de Prisma

Desde la carpeta `backend/`:

```bash
npx prisma generate --config prisma7.config.ts
```

### 7. Aplicar las migraciones

```bash
npx prisma migrate deploy --config prisma7.config.ts
```

Este comando aplica las migraciones existentes y crea la estructura de tablas en PostgreSQL.

### 8. Cargar datos de demostración (opcional)

Para cargar los registros de ejemplo:

```bash
npm run seed-demo
```

El script `src/scripts/seed-demo.ts` crea datos de demostración para probar el funcionamiento del sistema.

## Ejecución del proyecto

Para utilizar la aplicación deben iniciarse el frontend y el backend en dos terminales diferentes.

### 9. Iniciar el backend

Desde la carpeta `backend/`:

```bash
npm run dev
```

El servidor se inicia en:

```text
http://localhost:3000
```

### 10. Iniciar el frontend

Desde la carpeta principal del proyecto:

```bash
npm run dev
```

Vite mostrará la dirección local de la aplicación, normalmente:

```text
http://localhost:5173
```

## Objetivo del proyecto

Centralizar la gestión de trabajadores, turnos y aptos médicos laborales, facilitando el intercambio de información entre clínicas y empresas, con acceso controlado según los roles de usuario.