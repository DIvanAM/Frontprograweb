import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DiaSemana, Empleado } from '../../../core/models/rrhh.models';
import { DIAS_SEMANA_ORDEN } from '../../../core/services/rrhh-mock.data';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [NavbarComponent, RouterLink, ReactiveFormsModule, CurrencyPipe],
  template: `
    <app-navbar />

    <main class="page-container">
      <!-- Page Header (Screenshot 1) -->
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Directorio & Control de Personal</h1>
            <p class="page-subtitle">
              Consulta paginada, edición de registros y baja lógica de empleados.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <div class="view-toggle">
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'table'"
              [class.btn-outline]="viewMode() !== 'table'"
              (click)="viewMode.set('table')"
            >
              Tabla
            </button>
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="viewMode() === 'cards'"
              [class.btn-outline]="viewMode() !== 'cards'"
              (click)="viewMode.set('cards')"
            >
              Tarjetas
            </button>
          </div>

          <a routerLink="/admin/empleados/nuevo" class="btn btn-primary">
            + Dar de Alta Nuevo Empleado
          </a>
        </div>
      </div>

      <!-- Filter Bar (Screenshot 1 style) -->
      <section class="card filter-card">
        <div class="filter-row">
          <div class="filter-label">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>DEPARTAMENTO:</span>
          </div>

          <div class="filter-pills">
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedDepto() === 0"
              (click)="setDepto(0)"
            >
              Todos
            </button>
            @for (d of departamentos(); track d.id) {
              <button
                type="button"
                class="pill-btn"
                [class.active]="selectedDepto() === d.id"
                (click)="setDepto(d.id)"
              >
                {{ d.nombre }}
              </button>
            }
          </div>
        </div>

        <div class="filter-row secondary-filters">
          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por nombre o matrícula en vivo..."
              [value]="searchText()"
              (input)="onSearch($any($event.target).value)"
            />
          </div>

          <div class="status-pills">
            <span class="filter-label-sm">ESTATUS:</span>
            @for (st of ['Todos', 'Activo', 'Inactivo']; track st) {
              <button
                type="button"
                class="pill-btn"
                [class.active]="selectedStatus() === st"
                (click)="setStatus(st)"
              >
                {{ st }}
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Empty State -->
      @if (filteredEmpleados().length === 0) {
        <div class="card empty-state" style="margin-top: 18px;">
          <div class="empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h3>No se encontraron empleados</h3>
          <p>Intenta ajustar los filtros de departamento, estatus o búsqueda.</p>
        </div>
      } @else if (viewMode() === 'cards') {
        <!-- Cards Grid (Screenshot 1 exact layout) -->
        <section class="cards-grid">
          @for (emp of paginatedEmpleados(); track emp.id) {
            <article class="card emp-card">
              <div class="emp-card-top">
                <span class="badge-code">{{ emp.numeroEmpleado }}</span>
                <span class="badge badge-neutral">{{ emp.departamentoNombre }}</span>
              </div>

              <h3 class="emp-name">
                {{ emp.nombre }} {{ emp.apellidoPaterno }} {{ emp.apellidoMaterno }}
              </h3>
              <p class="emp-role">{{ emp.puestoNombre }} · {{ emp.correoInstitucional }}</p>

              <div class="emp-info-box">
                <span class="info-label">Horario: {{ emp.horaEntradaEstablecida }} - {{ emp.horaSalidaEstablecida }}</span>
                <strong class="info-value">{{ emp.diasLaborales.join(' ') }}</strong>
              </div>
              @if (emp.tienePrestamoEmpresa || emp.tieneCreditoInfonavit) {
                <div class="credit-badges">
                  @if (emp.tienePrestamoEmpresa) {
                    <span class="badge badge-warning-soft">Préstamo: {{ emp.montoPrestamoQuincenal | currency: 'MXN' : 'symbol-narrow' : '1.0-0' }}/qna</span>
                  }
                  @if (emp.tieneCreditoInfonavit) {
                    <span class="badge badge-neutral">Infonavit activo</span>
                  }
                </div>
              }

              <div class="emp-card-footer">
                <span
                  class="badge"
                  [class.badge-success]="emp.estatus === 'Activo'"
                  [class.badge-danger]="emp.estatus === 'Inactivo'"
                >
                  {{ emp.estatus }}
                </span>

                <div class="btn-group">
                  <button type="button" class="btn btn-sm btn-outline" (click)="openEdit(emp)">
                    Editar
                  </button>
                  @if (emp.estatus === 'Activo') {
                    <button
                      type="button"
                      class="btn btn-sm btn-danger-outline"
                      (click)="confirmBaja(emp)"
                    >
                      Baja
                    </button>
                  } @else {
                    <button
                      type="button"
                      class="btn btn-sm btn-success-outline"
                      (click)="reactivar(emp)"
                    >
                      Reactivar
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </section>
      } @else {
        <!-- Table View (RF 1.2.3) -->
        <section class="card card-accent-left" style="margin-top: 18px;">
          <div class="card-header">
            <div class="card-header-title">
              <span>Listado General de Empleados</span>
              <span class="badge badge-dark">{{ filteredEmpleados().length }} Registros</span>
            </div>
            <span class="page-info">
              Página {{ currentPage() }} de {{ totalPages() }}
            </span>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Nombre Completo</th>
                  <th>Departamento</th>
                  <th>Puesto</th>
                  <th>Jornada</th>
                  <th>Salario Base</th>
                  <th>Estatus</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (emp of paginatedEmpleados(); track emp.id) {
                  <tr>
                    <td><span class="badge-code">{{ emp.numeroEmpleado }}</span></td>
                    <td>
                      <strong>{{ emp.nombre }} {{ emp.apellidoPaterno }} {{ emp.apellidoMaterno }}</strong>
                      <div class="sub-cell">{{ emp.correoInstitucional }}</div>
                    </td>
                    <td><span class="badge badge-neutral">{{ emp.departamentoNombre }}</span></td>
                    <td>{{ emp.puestoNombre }}</td>
                    <td>
                      <strong>{{ emp.horaEntradaEstablecida }} - {{ emp.horaSalidaEstablecida }}</strong>
                      <div class="sub-cell">{{ emp.diasLaborales.join(' ') }} ({{ emp.horasPorDia }}h)</div>
                    </td>
                    <td>
                      <strong>{{ emp.salarioBase | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</strong>
                      @if (emp.tienePrestamoEmpresa || emp.tieneCreditoInfonavit) {
                        <div class="sub-cell">
                          {{ emp.tienePrestamoEmpresa ? 'Préstamo ' : '' }}{{ emp.tieneCreditoInfonavit ? 'Infonavit' : '' }}
                        </div>
                      }
                    </td>
                    <td>
                      <span
                        class="badge"
                        [class.badge-success]="emp.estatus === 'Activo'"
                        [class.badge-danger]="emp.estatus === 'Inactivo'"
                      >
                        {{ emp.estatus }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-outline" (click)="openEdit(emp)">
                          Editar
                        </button>
                        @if (emp.estatus === 'Activo') {
                          <button
                            type="button"
                            class="btn btn-sm btn-danger-outline"
                            (click)="confirmBaja(emp)"
                          >
                            Dar de Baja
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="btn btn-sm btn-success-outline"
                            (click)="reactivar(emp)"
                          >
                            Reactivar
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="pagination-bar">
            <span class="page-info">
              Mostrando {{ paginatedEmpleados().length }} de {{ filteredEmpleados().length }} empleados
            </span>
            <div class="btn-group">
              <button
                type="button"
                class="btn btn-sm btn-outline"
                [disabled]="currentPage() <= 1"
                (click)="currentPage.set(currentPage() - 1)"
              >
                Anterior
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                [disabled]="currentPage() >= totalPages()"
                (click)="currentPage.set(currentPage() + 1)"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      }

      <!-- Edit Employee Modal (RF 1.2.4) -->
      @if (editingEmpleado()) {
        <div class="modal-backdrop" (click)="editingEmpleado.set(null)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Editar Empleado — {{ editingEmpleado()!.numeroEmpleado }}</h3>
              <button type="button" class="btn btn-sm btn-outline" (click)="editingEmpleado.set(null)">
                ×
              </button>
            </div>

            <form [formGroup]="editForm" (ngSubmit)="saveEdit()" novalidate>
              <div class="modal-body">
                <div class="modal-grid">
                  <div class="form-group">
                    <label class="form-label">Nombre(s) <span class="required">*</span></label>
                    <input type="text" class="form-control" formControlName="nombre" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Apellido Paterno <span class="required">*</span></label>
                    <input type="text" class="form-control" formControlName="apellidoPaterno" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Apellido Materno <span class="required">*</span></label>
                    <input type="text" class="form-control" formControlName="apellidoMaterno" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Teléfono <span class="required">*</span></label>
                    <input type="text" class="form-control" formControlName="telefono" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Departamento <span class="required">*</span></label>
                    <select class="form-control" formControlName="departamentoId">
                      @for (d of departamentos(); track d.id) {
                        <option [value]="d.id">{{ d.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Puesto <span class="required">*</span></label>
                    <select class="form-control" formControlName="puestoId">
                      @for (p of puestos(); track p.id) {
                        <option [value]="p.id">{{ p.nombre }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Salario Base (MXN) <span class="required">*</span></label>
                    <input type="number" step="0.01" class="form-control" formControlName="salarioBase" />
                    @if (editForm.controls.salarioBase.invalid && editForm.controls.salarioBase.touched) {
                      <span class="form-error">Debe ser mayor a $0.00.</span>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Rol <span class="required">*</span></label>
                    <select class="form-control" formControlName="rol">
                      <option value="EMPLEADO">Empleado</option>
                      <option value="ADMIN">Administrador RH</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Hora Entrada <span class="required">*</span></label>
                    <input type="time" class="form-control" formControlName="horaEntradaEstablecida" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Hora Salida <span class="required">*</span></label>
                    <input type="time" class="form-control" formControlName="horaSalidaEstablecida" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Días Laborales (Gris = Descanso)</label>
                  <div class="days-row">
                    @for (d of diasOrden; track d.key) {
                      <button
                        type="button"
                        class="day-pill"
                        [class.active]="editDias().includes(d.key)"
                        (click)="toggleEditDia(d.key)"
                      >
                        {{ d.key }}
                      </button>
                    }
                  </div>
                </div>

                <div class="modal-grid">
                  <div class="form-group">
                    <label class="check-label">
                      <input type="checkbox" formControlName="tienePrestamoEmpresa" />
                      <span>Préstamo de empresa</span>
                    </label>
                    @if (editForm.controls.tienePrestamoEmpresa.value) {
                      <input
                        type="number"
                        min="0"
                        class="form-control"
                        style="margin-top: 6px;"
                        formControlName="montoPrestamoQuincenal"
                        placeholder="Descuento quincenal MXN"
                      />
                    }
                  </div>
                  <div class="form-group">
                    <label class="check-label">
                      <input type="checkbox" formControlName="tieneCreditoInfonavit" />
                      <span>Crédito Infonavit</span>
                    </label>
                    @if (editForm.controls.tieneCreditoInfonavit.value) {
                      <input
                        type="number"
                        min="0"
                        class="form-control"
                        style="margin-top: 6px;"
                        formControlName="descuentoInfonavitQuincenal"
                        placeholder="Descuento quincenal MXN"
                      />
                    }
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" (click)="editingEmpleado.set(null)">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary" [disabled]="editForm.invalid">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Baja Lógica Confirmation Modal (RF 1.2.5) -->
      @if (bajaCandidate()) {
        <div class="modal-backdrop" (click)="bajaCandidate.set(null)">
          <div class="modal-dialog" style="max-width: 440px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Confirmar Baja Lógica</h3>
              <button type="button" class="btn btn-sm btn-outline" (click)="bajaCandidate.set(null)">
                ×
              </button>
            </div>
            <div class="modal-body">
              <p style="margin: 0;">
                ¿Deseas dar de baja a
                <strong>{{ bajaCandidate()!.nombre }} {{ bajaCandidate()!.apellidoPaterno }}</strong>?
              </p>
              <p class="form-hint" style="margin-top: 8px;">
                El registro se conservará en el historial con estatus <strong>Inactivo</strong> y su acceso al sistema será bloqueado inmediatamente.
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="bajaCandidate.set(null)">
                Cancelar
              </button>
              <button type="button" class="btn btn-danger" (click)="executeBaja()">
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      }
    </main>
  `,
  styles: `
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .view-toggle {
      display: inline-flex;
      gap: 4px;
    }

    .filter-card {
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .secondary-filters {
      padding-top: 12px;
      border-top: 1px solid var(--color-border);
    }

    .filter-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      letter-spacing: 0.03em;
    }

    .filter-label-sm {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
    }

    .filter-pills,
    .status-pills {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }

    .pill-btn {
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }

      &.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #ffffff;
      }
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 240px;
      max-width: 420px;

      svg {
        position: absolute;
        left: 11px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-muted);
      }

      .form-control {
        padding-left: 34px;
      }
    }

    .cards-grid {
      margin-top: 18px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
      gap: 16px;
    }

    .emp-card {
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .emp-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .emp-name {
      margin: 2px 0 0;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .emp-role {
      margin: 0;
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .emp-info-box {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 9px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;

      .info-label { color: var(--color-text-muted); }
      .info-value { color: var(--color-primary-dark); }
    }

    .emp-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }

    .sub-cell {
      font-size: 0.76rem;
      color: var(--color-text-muted);
    }

    .btn-group {
      display: flex;
      gap: 6px;
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      border-top: 1px solid var(--color-border);
      background: var(--color-surface-muted);
    }

    .page-info {
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .credit-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .days-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .day-pill {
      min-width: 36px;
      height: 32px;
      padding: 0 8px;
      border-radius: 6px;
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;

      &.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #ffffff;
      }
    }

    .check-label {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 600px) {
      .modal-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EmpleadosListComponent {
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly departamentos = this.rrhh.departamentos;
  readonly puestos = this.rrhh.puestos;

  readonly viewMode = signal<'table' | 'cards'>('table');
  readonly selectedDepto = signal<number>(0);
  readonly selectedStatus = signal<string>('Todos');
  readonly searchText = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = 5;

  readonly editingEmpleado = signal<Empleado | null>(null);
  readonly bajaCandidate = signal<Empleado | null>(null);
  readonly diasOrden = DIAS_SEMANA_ORDEN;
  readonly editDias = signal<DiaSemana[]>(['L', 'M', 'Mi', 'J', 'V']);

  readonly editForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: ['', Validators.required],
    telefono: ['', Validators.required],
    departamentoId: [1, Validators.required],
    puestoId: [1, Validators.required],
    salarioBase: [1, [Validators.required, Validators.min(0.01)]],
    horaEntradaEstablecida: ['09:00', Validators.required],
    horaSalidaEstablecida: ['17:00', Validators.required],
    tienePrestamoEmpresa: [false],
    montoPrestamoQuincenal: [0],
    tieneCreditoInfonavit: [false],
    descuentoInfonavitQuincenal: [0],
    rol: ['EMPLEADO' as 'ADMIN' | 'EMPLEADO', Validators.required],
  });

  readonly filteredEmpleados = computed(() => {
    const depto = this.selectedDepto();
    const status = this.selectedStatus();
    const q = this.searchText().trim().toLowerCase();

    return this.rrhh.empleados().filter((e) => {
      if (depto !== 0 && e.departamentoId !== depto) return false;
      if (status !== 'Todos' && e.estatus !== status) return false;
      if (q) {
        const fullName = `${e.nombre} ${e.apellidoPaterno} ${e.apellidoMaterno}`.toLowerCase();
        if (!fullName.includes(q) && !e.numeroEmpleado.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredEmpleados().length / this.pageSize)),
  );

  readonly paginatedEmpleados = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages());
    const start = (page - 1) * this.pageSize;
    return this.filteredEmpleados().slice(start, start + this.pageSize);
  });

  setDepto(id: number): void {
    this.selectedDepto.set(id);
    this.currentPage.set(1);
  }

  setStatus(st: string): void {
    this.selectedStatus.set(st);
    this.currentPage.set(1);
  }

  onSearch(val: string): void {
    this.searchText.set(val);
    this.currentPage.set(1);
  }

  openEdit(emp: Empleado): void {
    this.editingEmpleado.set(emp);
    this.editDias.set([...emp.diasLaborales]);
    this.editForm.setValue({
      nombre: emp.nombre,
      apellidoPaterno: emp.apellidoPaterno,
      apellidoMaterno: emp.apellidoMaterno,
      telefono: emp.telefono,
      departamentoId: emp.departamentoId,
      puestoId: emp.puestoId,
      salarioBase: emp.salarioBase,
      horaEntradaEstablecida: emp.horaEntradaEstablecida,
      horaSalidaEstablecida: emp.horaSalidaEstablecida,
      tienePrestamoEmpresa: emp.tienePrestamoEmpresa,
      montoPrestamoQuincenal: emp.montoPrestamoQuincenal,
      tieneCreditoInfonavit: emp.tieneCreditoInfonavit,
      descuentoInfonavitQuincenal: emp.descuentoInfonavitQuincenal,
      rol: emp.rol,
    });
  }

  toggleEditDia(d: DiaSemana): void {
    const current = this.editDias();
    if (current.includes(d)) {
      if (current.length <= 1) return;
      this.editDias.set(current.filter((x) => x !== d));
    } else {
      const ordenados = DIAS_SEMANA_ORDEN.map((x) => x.key).filter(
        (k) => k === d || current.includes(k),
      );
      this.editDias.set(ordenados);
    }
  }

  saveEdit(): void {
    const emp = this.editingEmpleado();
    if (!emp || this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const res = this.rrhh.actualizarEmpleado(emp.id, {
      ...this.editForm.getRawValue(),
      diasLaborales: this.editDias(),
    });
    if (res.ok) {
      this.toast.success('Empleado actualizado', res.message);
      this.editingEmpleado.set(null);
    } else {
      this.toast.error('Error al actualizar', res.message);
    }
  }

  confirmBaja(emp: Empleado): void {
    this.bajaCandidate.set(emp);
  }

  executeBaja(): void {
    const emp = this.bajaCandidate();
    if (!emp) return;
    const res = this.rrhh.cambiarEstatusEmpleado(emp.id, 'Inactivo');
    if (res.ok) {
      this.toast.warning('Baja lógica aplicada', res.message);
      this.bajaCandidate.set(null);
    }
  }

  reactivar(emp: Empleado): void {
    const res = this.rrhh.cambiarEstatusEmpleado(emp.id, 'Activo');
    if (res.ok) {
      this.toast.success('Empleado reactivado', res.message);
    }
  }
}
