import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NavbarComponent, RouterLink, CurrencyPipe],
  template: `
    <app-navbar />

    <main class="page-container">
      <!-- Page Header (Screenshot 4) -->
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Panel General de Recursos Humanos</h1>
            <p class="page-subtitle">
              Indicadores clave de personal, solicitudes de ausencia y control de catálogos.
            </p>
          </div>
        </div>

        <a routerLink="/admin/empleados/nuevo" class="btn btn-primary">
          + Dar de Alta Nuevo Empleado
        </a>
      </div>

      <!-- KPI Cards (Screenshot 4) -->
      <section class="kpi-grid">
        <div class="kpi-card kpi-green">
          <div>
            <div class="kpi-label">Empleados Activos</div>
            <div class="kpi-value">{{ activosCount() }}</div>
            <div class="kpi-sub">De {{ empleados().length }} registros totales en plantilla</div>
          </div>
          <div class="kpi-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
        </div>

        <div class="kpi-card kpi-gold">
          <div>
            <div class="kpi-label">Solicitudes Pendientes</div>
            <div class="kpi-value">{{ pendientes().length }}</div>
            <div class="kpi-sub">Permisos y vacaciones por autorizar</div>
          </div>
          <div class="kpi-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
        </div>

        <div class="kpi-card kpi-red">
          <div>
            <div class="kpi-label">Personal Inactivo (Bajas)</div>
            <div class="kpi-value">{{ inactivosCount() }}</div>
            <div class="kpi-sub">Cuentas con acceso deshabilitado</div>
          </div>
          <div class="kpi-icon">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="18" y1="8" x2="23" y2="13"/>
              <line x1="23" y1="8" x2="18" y2="13"/>
            </svg>
          </div>
        </div>
      </section>

      <!-- Priority Banner (Screenshot 4) -->
      <section class="priority-card">
        <div class="priority-header">
          <div class="priority-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Bandeja Prioritaria de Solicitudes (Pendientes de Resolución)</span>
          </div>
          <span class="badge badge-danger badge-pill">{{ pendientes().length }} Pendiente(s)</span>
        </div>

        @if (pendientes().length === 0) {
          <div class="empty-state" style="padding: 28px 16px;">
            <div class="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3>No hay solicitudes pendientes por atender</h3>
            <p>Todas las peticiones de permisos y vacaciones han sido procesadas.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Fechas</th>
                  <th>Motivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (sol of pendientes(); track sol.id) {
                  <tr>
                    <td><span class="badge-code">{{ sol.numeroEmpleado }}</span></td>
                    <td>
                      <strong>{{ sol.empleadoNombre }}</strong>
                      <div class="sub-cell">{{ sol.departamentoNombre }}</div>
                    </td>
                    <td><span class="badge badge-neutral">{{ sol.tipo }}</span></td>
                    <td>
                      {{ sol.fechaInicio }} al {{ sol.fechaFin }}
                      <div class="sub-cell">{{ sol.diasSolicitados }} día(s)</div>
                    </td>
                    <td class="motivo-cell">{{ sol.motivo }}</td>
                    <td>
                      <div class="btn-group">
                        <button
                          type="button"
                          class="btn btn-sm btn-success-outline"
                          (click)="resolver(sol.id, 'Aprobada')"
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          class="btn btn-sm btn-danger-outline"
                          (click)="resolver(sol.id, 'Rechazada')"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <!-- Recent Employees Table (Screenshot 4) -->
      <section class="card card-accent-left" style="margin-top: 22px;">
        <div class="card-header">
          <div class="card-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>Plantilla Reciente de Personal</span>
            <span class="badge badge-dark">{{ empleadosFiltrados().length }} Registros</span>
          </div>

          <div class="search-inline">
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por matrícula o nombre..."
              [value]="searchQuery()"
              (input)="searchQuery.set($any($event.target).value)"
            />
            <a routerLink="/admin/empleados" class="btn btn-outline btn-sm">Ver Directorio Completo</a>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Empleado</th>
                <th>Departamento / Puesto</th>
                <th>Ingreso</th>
                <th>Salario Base</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              @for (emp of empleadosFiltrados().slice(0, 6); track emp.id) {
                <tr>
                  <td><span class="badge-code">{{ emp.numeroEmpleado }}</span></td>
                  <td>
                    <strong>{{ emp.nombre }} {{ emp.apellidoPaterno }} {{ emp.apellidoMaterno }}</strong>
                    <div class="sub-cell">{{ emp.correoInstitucional }}</div>
                  </td>
                  <td>
                    <span class="badge badge-neutral">{{ emp.departamentoNombre }}</span>
                    <div class="sub-cell">{{ emp.puestoNombre }}</div>
                  </td>
                  <td>{{ emp.fechaIngreso }}</td>
                  <td><strong>{{ emp.salarioBase | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</strong></td>
                  <td>
                    <span
                      class="badge"
                      [class.badge-success]="emp.estatus === 'Activo'"
                      [class.badge-danger]="emp.estatus === 'Inactivo'"
                    >
                      {{ emp.estatus }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `,
  styles: `
    .priority-card {
      background: var(--color-surface);
      border: 1px solid var(--color-danger-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .priority-header {
      background: var(--color-danger-bg);
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid var(--color-danger-border);
    }

    .priority-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.92rem;
    }

    .sub-cell {
      font-size: 0.76rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .motivo-cell {
      max-width: 240px;
      font-size: 0.82rem;
      color: var(--color-text-secondary);
    }

    .btn-group {
      display: flex;
      gap: 6px;
    }

    .search-inline {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .form-control {
        width: 240px;
        padding: 6px 10px;
      }
    }
  `,
})
export class AdminDashboardComponent {
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly empleados = this.rrhh.empleados;
  readonly searchQuery = signal('');

  readonly activosCount = computed(
    () => this.empleados().filter((e) => e.estatus === 'Activo').length,
  );
  readonly inactivosCount = computed(
    () => this.empleados().filter((e) => e.estatus === 'Inactivo').length,
  );
  readonly pendientes = computed(() =>
    this.rrhh.solicitudes().filter((s) => s.estatus === 'Pendiente'),
  );

  readonly empleadosFiltrados = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.empleados();
    return this.empleados().filter(
      (e) =>
        e.numeroEmpleado.toLowerCase().includes(q) ||
        `${e.nombre} ${e.apellidoPaterno} ${e.apellidoMaterno}`.toLowerCase().includes(q),
    );
  });

  resolver(id: number, estatus: 'Aprobada' | 'Rechazada'): void {
    const res = this.rrhh.resolverSolicitud(id, estatus);
    if (res.ok) {
      this.toast.success(
        estatus === 'Aprobada' ? 'Solicitud Aprobada' : 'Solicitud Rechazada',
        res.message,
      );
    }
  }
}
