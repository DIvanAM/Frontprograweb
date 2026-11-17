import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DiaSemana } from '../../../core/models/rrhh.models';
import { DIAS_SEMANA_ORDEN } from '../../../core/services/rrhh-mock.data';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-empleado-form',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, RouterLink, CurrencyPipe],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Alta de Nuevo Personal</h1>
            <p class="page-subtitle">
              Registro de datos personales, horario estricto, días laborales y generación automática de credenciales.
            </p>
          </div>
        </div>

        <span class="date-badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Fecha: {{ fechaHoy }}
        </span>
      </div>

      @if (createdResult()) {
        <div class="card success-banner">
          <div class="success-banner-inner">
            <div>
              <h3>¡Empleado registrado exitosamente!</h3>
              <p>
                <strong>{{ createdResult()!.nombreCompleto }}</strong>
                ({{ createdResult()!.correo }}) fue dado de alta con estatus <strong>Activo</strong>.
              </p>
              <div class="cred-box">
                <span>Contraseña inicial autogenerada:</span>
                <code class="cred-code">{{ createdResult()!.passwordInicial }}</code>
                <small>(Se solicitará cambio obligatorio en el primer inicio de sesión)</small>
              </div>
            </div>
            <div class="banner-actions">
              <button type="button" class="btn btn-outline" (click)="resetForAnother()">
                Registrar Otro
              </button>
              <a routerLink="/admin/empleados" class="btn btn-primary">
                Ir al Directorio
              </a>
            </div>
          </div>
        </div>
      }

      <div class="form-layout">
        <!-- Left Column: Main Form -->
        <section class="card card-accent-top">
          <div class="card-header">
            <h2 class="card-header-title">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Datos Personales, Horario Estricto y Créditos
            </h2>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-body" novalidate>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="numEmp">
                  Número de Empleado / Matrícula <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <span class="input-icon">#</span>
                  <input
                    id="numEmp"
                    type="text"
                    class="form-control has-icon"
                    formControlName="numeroEmpleado"
                    placeholder="Ej. 202607"
                    (input)="syncPreview()"
                    [class.is-invalid]="isInvalid('numeroEmpleado')"
                  />
                </div>
                <span class="form-hint">Se usan los primeros 3 dígitos para la clave inicial.</span>
                @if (isInvalid('numeroEmpleado')) {
                  <span class="form-error">La matrícula es obligatoria (mín. 3 caracteres).</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="rol">
                  Rol del Sistema <span class="required">*</span>
                </label>
                <select id="rol" class="form-control" formControlName="rol">
                  <option value="EMPLEADO">Empleado</option>
                  <option value="ADMIN">Administrador (Recursos Humanos)</option>
                </select>
              </div>
            </div>

            <div class="grid-3">
              <div class="form-group">
                <label class="form-label" for="nombre">
                  Nombre(s) <span class="required">*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  class="form-control"
                  formControlName="nombre"
                  placeholder="Ej. Laura"
                  (input)="syncPreview()"
                  [class.is-invalid]="isInvalid('nombre')"
                />
                @if (isInvalid('nombre')) {
                  <span class="form-error">El nombre es obligatorio.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="apPat">
                  Apellido Paterno <span class="required">*</span>
                </label>
                <input
                  id="apPat"
                  type="text"
                  class="form-control"
                  formControlName="apellidoPaterno"
                  placeholder="Ej. Hernández"
                  [class.is-invalid]="isInvalid('apellidoPaterno')"
                />
                @if (isInvalid('apellidoPaterno')) {
                  <span class="form-error">Obligatorio.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="apMat">
                  Apellido Materno <span class="required">*</span>
                </label>
                <input
                  id="apMat"
                  type="text"
                  class="form-control"
                  formControlName="apellidoMaterno"
                  placeholder="Ej. Morales"
                  (input)="syncPreview()"
                  [class.is-invalid]="isInvalid('apellidoMaterno')"
                />
                @if (isInvalid('apellidoMaterno')) {
                  <span class="form-error">Obligatorio.</span>
                }
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="correo">
                  Correo Electrónico Institucional <span class="required">*</span>
                </label>
                <input
                  id="correo"
                  type="email"
                  class="form-control"
                  formControlName="correoInstitucional"
                  placeholder="laura.hernandez@empresa.mx"
                  [class.is-invalid]="isInvalid('correoInstitucional')"
                />
                @if (isInvalid('correoInstitucional')) {
                  <span class="form-error">Ingresa un correo válido.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="telefono">
                  Teléfono <span class="required">*</span>
                </label>
                <input
                  id="telefono"
                  type="tel"
                  class="form-control"
                  formControlName="telefono"
                  placeholder="5512345678"
                  [class.is-invalid]="isInvalid('telefono')"
                />
                @if (isInvalid('telefono')) {
                  <span class="form-error">Ingresa un teléfono válido.</span>
                }
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="depto">
                  Departamento <span class="required">*</span>
                </label>
                <select
                  id="depto"
                  class="form-control"
                  formControlName="departamentoId"
                  (change)="onDeptoChange()"
                >
                  @for (d of departamentos(); track d.id) {
                    <option [value]="d.id">{{ d.nombre }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="puesto">
                  Puesto de Trabajo <span class="required">*</span>
                </label>
                <select id="puesto" class="form-control" formControlName="puestoId">
                  @for (p of puestosFiltrados(); track p.id) {
                    <option [value]="p.id">{{ p.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="salario">
                  Salario Base Mensual (MXN) <span class="required">*</span>
                </label>
                <input
                  id="salario"
                  type="number"
                  step="0.01"
                  class="form-control"
                  formControlName="salarioBase"
                  placeholder="Ej. 18500.00"
                  [class.is-invalid]="isInvalid('salarioBase')"
                />
                @if (isInvalid('salarioBase')) {
                  <span class="form-error">El salario debe ser estrictamente mayor a $0.00.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="fechaIngreso">
                  Fecha de Ingreso <span class="required">*</span>
                </label>
                <input
                  id="fechaIngreso"
                  type="date"
                  class="form-control"
                  formControlName="fechaIngreso"
                  [class.is-invalid]="isInvalid('fechaIngreso')"
                />
              </div>
            </div>

            <!-- Horario Estricto y Días Laborales -->
            <div class="schedule-box">
              <div class="schedule-title">Horario Estricto y Días de Trabajo</div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="horaEntrada">
                    Hora de Entrada Establecida <span class="required">*</span>
                  </label>
                  <input
                    id="horaEntrada"
                    type="time"
                    class="form-control"
                    formControlName="horaEntradaEstablecida"
                    (change)="syncPreview()"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="horaSalida">
                    Hora de Salida Establecida <span class="required">*</span>
                  </label>
                  <input
                    id="horaSalida"
                    type="time"
                    class="form-control"
                    formControlName="horaSalidaEstablecida"
                    (change)="syncPreview()"
                  />
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 4px;">
                <label class="form-label">
                  Días Laborales (los no seleccionados serán días de descanso) <span class="required">*</span>
                </label>
                <div class="days-row">
                  @for (d of diasOrden; track d.key) {
                    <button
                      type="button"
                      class="day-pill"
                      [class.active]="isDiaSelected(d.key)"
                      (click)="toggleDia(d.key)"
                      [title]="d.label + (isDiaSelected(d.key) ? ' (Laboral)' : ' (Descanso)')"
                    >
                      {{ d.key }}
                    </button>
                  }
                </div>
                <span class="form-hint">
                  Activos en verde = Días laborales ({{ selectedDias().length }} días/sem) ·
                  Gris = Días de descanso ({{ 7 - selectedDias().length }} días/sem).
                </span>
              </div>
            </div>

            <!-- Créditos / Préstamos opcionales -->
            <div class="schedule-box" style="margin-top: 14px;">
              <div class="schedule-title">Préstamos y Créditos (Opcional)</div>
              <div class="grid-2">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="check-label">
                    <input type="checkbox" formControlName="tienePrestamoEmpresa" />
                    <span>Tiene préstamo de empresa</span>
                  </label>
                  @if (form.controls.tienePrestamoEmpresa.value) {
                    <input
                      type="number"
                      min="0"
                      step="50"
                      class="form-control"
                      style="margin-top: 6px;"
                      formControlName="montoPrestamoQuincenal"
                      placeholder="Descuento quincenal MXN"
                    />
                  }
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label class="check-label">
                    <input type="checkbox" formControlName="tieneCreditoInfonavit" />
                    <span>Tiene crédito Infonavit</span>
                  </label>
                  @if (form.controls.tieneCreditoInfonavit.value) {
                    <input
                      type="number"
                      min="0"
                      step="50"
                      class="form-control"
                      style="margin-top: 6px;"
                      formControlName="descuentoInfonavitQuincenal"
                      placeholder="Descuento quincenal MXN (0 = % ley)"
                    />
                  }
                </div>
              </div>
            </div>

            <div class="form-actions">
              <a routerLink="/admin/empleados" class="btn btn-outline">Cancelar</a>
              <button type="submit" class="btn btn-primary btn-lg">
                Registrar Empleado
              </button>
            </div>
          </form>
        </section>

        <!-- Right Column: Auto-generated Credentials & Summary -->
        <div class="side-stack">
          <section class="card card-accent-top">
            <div class="card-header">
              <h2 class="card-header-title">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Credencial Inicial Automática
              </h2>
            </div>
            <div class="card-body">
              <p class="side-desc">
                El sistema autogenera la contraseña inicial combinando:
              </p>
              <ul class="formula-list">
                <li><strong>3 primeros dígitos</strong> del número de empleado</li>
                <li><strong>3 primeras letras</strong> del nombre</li>
                <li><strong>2 primeras letras</strong> del apellido materno</li>
              </ul>

              <div class="preview-box">
                <span class="preview-label">Vista previa de contraseña inicial:</span>
                <code class="preview-code">{{ passwordPreview() }}</code>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header">
              <h2 class="card-header-title">Resumen de Alta</h2>
              <span class="badge badge-neutral">Nuevo Registro</span>
            </div>
            <div class="card-body summary-list">
              <div class="summary-row">
                <span>Nombre completo:</span>
                <strong>{{ form.controls.nombre.value || '—' }} {{ form.controls.apellidoPaterno.value }}</strong>
              </div>
              <div class="summary-row">
                <span>Matrícula:</span>
                <strong>{{ form.controls.numeroEmpleado.value || '—' }}</strong>
              </div>
              <div class="summary-row">
                <span>Salario base:</span>
                <strong>
                  {{ (form.controls.salarioBase.value || 0) | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}
                </strong>
              </div>
              <div class="summary-row">
                <span>Horario estricto:</span>
                <strong>
                  {{ form.controls.horaEntradaEstablecida.value }} - {{ form.controls.horaSalidaEstablecida.value }}
                  ({{ horasDiariasPreview() }} hrs/día)
                </strong>
              </div>
              <div class="summary-row">
                <span>Días laborales:</span>
                <strong>{{ selectedDias().join(', ') || 'Ninguno' }} ({{ selectedDias().length }}d)</strong>
              </div>
              <div class="summary-row">
                <span>Estatus inicial:</span>
                <span class="badge badge-success">Activo</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  `,
  styles: `
    .date-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: var(--color-surface);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-sm);
      padding: 7px 12px;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .success-banner {
      margin-bottom: 20px;
      border-left: 4px solid var(--color-success);
      background: #f0fdf4;
      padding: 18px 20px;
    }

    .success-banner-inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      h3 {
        margin: 0 0 4px;
        color: #166534;
        font-size: 1.05rem;
      }

      p {
        margin: 0 0 10px;
        font-size: 0.86rem;
        color: var(--color-text-secondary);
      }
    }

    .cred-box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
    }

    .cred-code {
      background: #ffffff;
      border: 1px solid #86efac;
      padding: 3px 10px;
      border-radius: 5px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.95rem;
      color: #166534;
    }

    .banner-actions {
      display: flex;
      gap: 8px;
    }

    .form-layout {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
    }

    .schedule-box {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 14px;
      margin-top: 6px;
    }

    .schedule-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--color-primary-dark);
      margin-bottom: 10px;
    }

    .days-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .day-pill {
      min-width: 40px;
      height: 36px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
      transition: all 0.15s ease;

      &.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #ffffff;
      }
    }

    .check-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text);
      cursor: pointer;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }

    .side-stack {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .side-desc {
      margin: 0 0 8px;
      font-size: 0.84rem;
      color: var(--color-text-secondary);
    }

    .formula-list {
      margin: 0 0 14px;
      padding-left: 18px;
      font-size: 0.82rem;
      color: var(--color-text-secondary);
      display: grid;
      gap: 4px;
    }

    .preview-box {
      background: var(--color-primary-light);
      border: 1px dashed var(--color-primary);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .preview-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-primary-dark);
    }

    .preview-code {
      font-family: var(--font-mono);
      font-size: 1rem;
      font-weight: 800;
      color: var(--color-primary-dark);
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 5px;
      border: 1px solid #bbf7d0;
    }

    .summary-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.84rem;
      color: var(--color-text-secondary);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--color-border);

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }
    }

    @media (max-width: 960px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .grid-2,
      .grid-3 {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EmpleadoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly departamentos = this.rrhh.departamentos;
  readonly fechaHoy = this.rrhh.obtenerFechaHoyISO();
  readonly diasOrden = DIAS_SEMANA_ORDEN;

  readonly previewTrigger = signal(0);
  readonly selectedDeptoId = signal(1);
  readonly selectedDias = signal<DiaSemana[]>(['L', 'M', 'Mi', 'J', 'V']);
  readonly createdResult = signal<{
    nombreCompleto: string;
    correo: string;
    passwordInicial: string;
  } | null>(null);

  readonly puestosFiltrados = computed(() => {
    const dId = Number(this.selectedDeptoId());
    const list = this.rrhh.puestos().filter((p) => p.departamentoId === dId);
    return list.length > 0 ? list : this.rrhh.puestos();
  });

  readonly form = this.fb.nonNullable.group({
    numeroEmpleado: ['', [Validators.required, Validators.minLength(3)]],
    nombre: ['', Validators.required],
    apellidoPaterno: ['', Validators.required],
    apellidoMaterno: ['', Validators.required],
    correoInstitucional: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.required, Validators.minLength(8)]],
    fechaIngreso: [this.fechaHoy, Validators.required],
    departamentoId: [1, Validators.required],
    puestoId: [1, Validators.required],
    salarioBase: [15000, [Validators.required, Validators.min(0.01)]],
    horaEntradaEstablecida: ['09:00', Validators.required],
    horaSalidaEstablecida: ['17:00', Validators.required],
    tienePrestamoEmpresa: [false],
    montoPrestamoQuincenal: [0],
    tieneCreditoInfonavit: [false],
    descuentoInfonavitQuincenal: [0],
    rol: ['EMPLEADO' as 'ADMIN' | 'EMPLEADO', Validators.required],
  });

  readonly horasDiariasPreview = computed(() => {
    this.previewTrigger();
    return this.rrhh.calcularHorasHorario(
      this.form.controls.horaEntradaEstablecida.value,
      this.form.controls.horaSalidaEstablecida.value,
    );
  });

  readonly passwordPreview = computed(() => {
    this.previewTrigger();
    return this.rrhh.generarPasswordInicial(
      this.form.controls.numeroEmpleado.value || '000',
      this.form.controls.nombre.value || 'Emp',
      this.form.controls.apellidoMaterno.value || 'Xx',
    );
  });

  syncPreview(): void {
    this.previewTrigger.update((n) => n + 1);
  }

  isDiaSelected(d: DiaSemana): boolean {
    return this.selectedDias().includes(d);
  }

  toggleDia(d: DiaSemana): void {
    const current = this.selectedDias();
    if (current.includes(d)) {
      if (current.length <= 1) {
        this.toast.warning('Días laborales', 'El empleado debe tener al menos 1 día laboral.');
        return;
      }
      this.selectedDias.set(current.filter((x) => x !== d));
    } else {
      const ordenados = DIAS_SEMANA_ORDEN.map((x) => x.key).filter(
        (k) => k === d || current.includes(k),
      );
      this.selectedDias.set(ordenados);
    }
  }

  onDeptoChange(): void {
    const deptoId = Number(this.form.controls.departamentoId.value);
    this.selectedDeptoId.set(deptoId);
    const firstPuesto = this.puestosFiltrados()[0];
    if (firstPuesto) {
      this.form.controls.puestoId.setValue(firstPuesto.id);
    }
  }

  isInvalid(field: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[field];
    return c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('Formulario incompleto', 'Revisa los campos obligatorios marcados en rojo.');
      return;
    }

    const val = this.form.getRawValue();
    const res = this.rrhh.crearEmpleado({
      ...val,
      diasLaborales: this.selectedDias(),
    });
    if (!res.ok || !res.data) {
      this.toast.error('No se pudo registrar', res.message);
      return;
    }

    this.createdResult.set({
      nombreCompleto: `${val.nombre} ${val.apellidoPaterno} ${val.apellidoMaterno}`,
      correo: val.correoInstitucional,
      passwordInicial: res.data.passwordInicial,
    });
    this.toast.success('Alta completada', res.message);
  }

  resetForAnother(): void {
    this.createdResult.set(null);
    this.selectedDias.set(['L', 'M', 'Mi', 'J', 'V']);
    this.form.reset({
      numeroEmpleado: '',
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      correoInstitucional: '',
      telefono: '',
      fechaIngreso: this.fechaHoy,
      departamentoId: 1,
      puestoId: 1,
      salarioBase: 15000,
      horaEntradaEstablecida: '09:00',
      horaSalidaEstablecida: '17:00',
      tienePrestamoEmpresa: false,
      montoPrestamoQuincenal: 0,
      tieneCreditoInfonavit: false,
      descuentoInfonavitQuincenal: 0,
      rol: 'EMPLEADO',
    });
    this.syncPreview();
  }
}
