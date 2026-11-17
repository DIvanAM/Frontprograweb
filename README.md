# Portal de Recursos Humanos — Frontend (Angular)

Proyecto Frontend desarrollado en **Angular** para la gestión integral de Recursos Humanos, personal, asistencia y solicitudes de ausencia.

## Requisitos Previos e Instalación

1. Asegúrate de tener **Node.js** (v20+ recomendado) y **npm** instalados.
2. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```
4. Abre `http://localhost:4200` en tu navegador.

---

## Cuentas de Prueba (Modo Demo Frontend)

En la pantalla de Login encontrarás botones de acceso rápido para probar cada flujo y regla de negocio:

| Rol / Escenario | Correo Institucional | Contraseña | Regla que prueba |
| :--- | :--- | :--- | :--- |
| **Administrador RH** | `admin.rh@empresa.mx` | `Admin123` | Panel completo de RH (RF 1.1.2, 1.2.1 - 1.2.7) |
| **Empleado Activo** | `diego.alvarez@empresa.mx` | `Emp12345` | Perfil, Asistencia y Solicitudes (RF 1.3.1 - 1.3.3) |
| **Primer Ingreso** | `sofia.ramirez@empresa.mx` | `202SofLo` | Cambio obligatorio de contraseña (RF 1.1.4) |
| **Cuenta Inactiva** | `mariana.torres@empresa.mx` | `Inactivo1` | Bloqueo de acceso por estatus Inactivo (RN 3.3) |

---

## Guía de Integración para el Equipo de Backend

Los contratos de datos (DTOs e interfaces TypeScript) se encuentran en:
- `src/app/core/models/rrhh.models.ts`
- `src/environments/environment.ts` (`apiUrl` y bandera `useMock`)

### Endpoints sugeridos para conectar con `RrhhService` y `AuthService`

- **Autenticación**
  - `POST /api/auth/login` -> Valida correo y contraseña encriptada (bcrypt/SHA-256+salt, **RNF 2.3**), verifica estatus `'Activo'` (**RN 3.3**) y retorna `{ token, empleado }`.
  - `POST /api/auth/change-password` -> Actualiza contraseña y marca `primerInicioSesion = false` (**RF 1.1.4**).
  - `POST /api/auth/logout` -> Invalida sesión/token (**RF 1.1.3**).
- **Empleados (Admin RH)**
  - `GET /api/empleados` -> Lista paginada con filtros por departamento, estatus, nombre o matrícula (**RF 1.2.3**).
  - `POST /api/empleados` -> Alta de empleado, autogeneración de clave inicial (**RF 1.2.2**) y validación de salario > 0 (**RN 3.2**).
  - `PUT /api/empleados/:id` -> Edición de empleado (**RF 1.2.4**).
  - `PATCH /api/empleados/:id/estatus` -> Baja lógica a `'Inactivo'` (**RF 1.2.5**).
- **Catálogos (Departamentos y Puestos)**
  - `GET / POST / PUT / DELETE /api/departamentos` y `/api/puestos` (**RF 1.2.6**, validando integridad relacional **RN 3.4**).
- **Asistencia y Solicitudes**
  - `POST /api/asistencias/entrada` y `POST /api/asistencias/salida` -> Usando hora del servidor y secuencia del día (**RF 1.3.2**, **RN 3.1**).
  - `GET / POST /api/solicitudes` y `PATCH /api/solicitudes/:id/resolver` -> Envío y aprobación/rechazo (**RF 1.2.7**, **RF 1.3.3**).
