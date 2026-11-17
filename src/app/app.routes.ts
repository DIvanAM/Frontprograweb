import { Routes } from '@angular/router';
import {
  authGuard,
  guestGuard,
  passwordChangeGuard,
  roleGuard,
} from './core/guards/auth.guards';
import { CatalogosComponent } from './features/admin/catalogos/catalogos.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { EmpleadoFormComponent } from './features/admin/empleado-form/empleado-form.component';
import { EmpleadosListComponent } from './features/admin/empleados-list/empleados-list.component';
import { ReporteNominaComponent } from './features/admin/reporte/reporte-nomina.component';
import { RetencionesConfigComponent } from './features/admin/retenciones/retenciones-config.component';
import { SolicitudesAdminComponent } from './features/admin/solicitudes-admin/solicitudes-admin.component';
import { ChangePasswordComponent } from './features/auth/change-password/change-password.component';
import { LoginComponent } from './features/auth/login/login.component';
import { EmpleadoAsistenciaComponent } from './features/empleado/asistencia/empleado-asistencia.component';
import { EmpleadoPerfilComponent } from './features/empleado/perfil/empleado-perfil.component';
import { EmpleadoRecibosComponent } from './features/empleado/recibos/empleado-recibos.component';
import { EmpleadoSolicitudesComponent } from './features/empleado/solicitudes/empleado-solicitudes.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Autenticación
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: 'cambiar-password',
    component: ChangePasswordComponent,
    canActivate: [passwordChangeGuard],
  },

  // Módulo Administrador / Recursos Humanos (RNF 2.1 + RF 1.1.2)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('ADMIN')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'empleados', component: EmpleadosListComponent },
      { path: 'empleados/nuevo', component: EmpleadoFormComponent },
      { path: 'catalogos', component: CatalogosComponent },
      { path: 'solicitudes', component: SolicitudesAdminComponent },
      { path: 'reporte', component: ReporteNominaComponent },
      { path: 'retenciones', component: RetencionesConfigComponent },
    ],
  },

  // Módulo Empleado (RNF 2.1 + RF 1.1.2)
  {
    path: 'empleado',
    canActivate: [authGuard, roleGuard('EMPLEADO')],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
      { path: 'perfil', component: EmpleadoPerfilComponent },
      { path: 'asistencia', component: EmpleadoAsistenciaComponent },
      { path: 'solicitudes', component: EmpleadoSolicitudesComponent },
      { path: 'recibos', component: EmpleadoRecibosComponent },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
