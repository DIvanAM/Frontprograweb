import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TipoAusencia } from '../../../core/models/rrhh.models';
import { AuthService } from '../../../core/services/auth.service';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-empleado-solicitudes',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Solicitudes de Permisos, Incidencias y Vacaciones</h1>
            <p class="page-subtitle">
              Envía peticiones de permisos, reposición de descansos, llegadas tarde, salidas temprano o vacaciones.
            </p>
          </div>
        </div>
      </div>

      <div class="solicitudes-grid">
        <!-- Left Form -->
        <section class="card card-accent-top">
          <div class="card-header">
            <h2 class="card-header-title">Nueva Solicitud</h2>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card-body" novalidate>
            <div class="form-group">
              <label class="form-label" for="tipo">
                Tipo de Solicitud <span class="required">*</span>
              </label>
              <select id="tipo" class="form-control" formControlName="tipo" (change)="onTipoChange()">
                <option value="Vacaciones">Vacaciones</option>
                <option value="Permiso con goce">Permiso con goce de sueldo</option>
                <option value="Permiso sin goce">Permiso sin goce de sueldo</option>
                <option value="Llegada tarde">Llegada tarde (Genera folio de incidencia)</option>
                <option value="Salida temprano">Salida temprano (Genera folio de incidencia)</option>
                <option value="Horas extras">Pago de horas extras</option>
                <option value="Incapacidad">Incapacidad médica</option>
              </select>
            </div>

            <div class="two-cols">
              <div class="form-group">
                <label class="form-label" for="inicio">
                  Fecha de Inicio <span class="required">*</span>
                </label>
                <input id="inicio" type="date" class="form-control" formControlName="fechaInicio" />
              </div>

              <div class="form-group">
                <label class="form-label" for="fin">
                  Fecha de Fin <span class="required">*</span>
                </label>
                <input id="fin" type="date" class="form-control" formControlName="fechaFin" />
              </div>
            </div>

            <!-- Reposición en día de descanso (solo para Permiso con/sin goce) -->
            @if (esPermiso()) {
              <div class="reponer-box">
                <label class="check-label">
                  <input
                    type="checkbox"
                    formControlName="reponerEnDescanso"
                    (change)="validarDiaDescanso()"
                  />
                  <span>¿Se repondrá este permiso en un día de descanso?</span>
                </label>

                @if (form.controls.reponerEnDescanso.value) {
                  <div class="form-group" style="margin-top: 10px; margin-bottom: 0;">
                    <label class="form-label" for="fechaRep">
                      Día de Descanso a Reponer <span class="required">*</span>
                    </label>
                    <input
                      id="fechaRep"
                      type="date"
                      class="form-control"
                      formControlName="fechaReposicion"
                      (change)="validarDiaDescanso()"
                    />
                    <span class="form-hint">
                      Tus días laborales son: {{ user()?.diasLaborales?.join(', ') }}. Solo puedes elegir un día de descanso.
                    </span>
                    @if (errorReposicion()) {
                      <span class="form-error">{{ errorReposicion() }}</span>
                    }
                  </div>
                }
              </div>
            }

            @if (form.controls.tipo.value === 'Horas extras') {
              <div class="form-group">
                <label class="form-label" for="hrsExtra">
                  Cantidad de Horas Extras <span class="required">*</span>
                </label>
                <input
                  id="hrsExtra"
                  type="number"
                  min="1"
                  max="12"
                  class="form-control"
                  formControlName="horasExtrasSolicitadas"
                />
              </div>
            }

            <div class="form-group">
              <label class="form-label" for="motivo">
                Motivo de la Solicitud <span class="required">*</span>
              </label>
              <textarea
                id="motivo"
                rows="3"
                class="form-control"
                formControlName="motivo"
                placeholder="Describe brevemente el motivo de tu solicitud..."
              ></textarea>
              @if (form.controls.motivo.invalid && form.controls.motivo.touched) {
                <span class="form-error">El motivo es obligatorio.</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%;"
              [disabled]="form.invalid || !!errorReposicion()"
            >
              Enviar Solicitud a Recursos Humanos
            </button>
          </form>
        </section>

        <!-- Right History -->
        <section class="card card-accent-left">
          <div class="card-header">
            <h2 class="card-header-title">Historial de Mis Solicitudes y Folios</h2>
            <span class="badge badge-dark">{{ misSolicitudes().length }} Registros</span>
          </div>

          @if (misSolicitudes().length === 0) {
            <div class="empty-state">
              <h3>No tienes solicitudes registradas</h3>
              <p>Cuando envíes una solicitud aparecerá aquí junto con su folio.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Tipo</th>
                    <th>Periodo</th>
                    <th>Motivo</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sol of misSolicitudes(); track sol.id) {
                    <tr>
                      <td><span class="badge-code">{{ sol.folio }}</span></td>
                      <td><span class="badge badge-neutral">{{ sol.tipo }}</span></td>
                      <td>
                        {{ sol.fechaInicio }} al {{ sol.fechaFin }}
                        <div class="sub-cell">{{ sol.diasSolicitados }} día(s)</div>
                        @if (sol.reponerEnDescanso && sol.fechaReposicion) {
                          <div class="admin-note">Repone: {{ sol.fechaReposicion }}</div>
                        }
                      </td>
                      <td>
                        {{ sol.motivo }}
                        @if (sol.comentarioAdmin) {
                          <div class="admin-note">RH: {{ sol.comentarioAdmin }}</div>
                        }
                      </td>
                      <td>
                        <span
                          class="badge"
                          [class.badge-warning-soft]="sol.estatus === 'Pendiente'"
                          [class.badge-success]="sol.estatus === 'Aprobada'"
                          [class.badge-danger]="sol.estatus === 'Rechazada'"
                        >
                          {{ sol.estatus }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    </main>
  `,
  styles: `
    .solicitudes-grid {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 20px;
      align-items: start;
    }

    .two-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .reponer-box {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px;
      margin-bottom: 14px;
    }

    .check-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
    }

    .sub-cell {
      font-size: 0.76rem;
      color: var(--color-text-muted);
    }

    .admin-note {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    @media (max-width: 900px) {
      .solicitudes-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EmpleadoSolicitudesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly hoy = this.rrhh.obtenerFechaHoyISO();
  readonly user = computed(() => this.auth.currentUser());
  readonly errorReposicion = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    tipo: ['Vacaciones' as TipoAusencia, Validators.required],
    fechaInicio: [this.hoy, Validators.required],
    fechaFin: [this.hoy, Validators.required],
    reponerEnDescanso: [false],
    fechaReposicion: [''],
    horasExtrasSolicitadas: [1],
    motivo: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly misSolicitudes = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return [];
    return this.rrhh.solicitudes().filter((s) => s.empleadoId === u.id);
  });

  esPermiso(): boolean {
    const t = this.form.controls.tipo.value;
    return t === 'Permiso con goce' || t === 'Permiso sin goce';
  }

  onTipoChange(): void {
    if (!this.esPermiso()) {
      this.form.controls.reponerEnDescanso.setValue(false);
      this.form.controls.fechaReposicion.setValue('');
      this.errorReposicion.set(null);
    }
  }

  validarDiaDescanso(): void {
    const u = this.auth.currentUser();
    if (!u || !this.form.controls.reponerEnDescanso.value) {
      this.errorReposicion.set(null);
      return;
    }

    const fecha = this.form.controls.fechaReposicion.value;
    if (!fecha) {
      this.errorReposicion.set('Selecciona la fecha del día de descanso que vas a reponer.');
      return;
    }

    if (!this.rrhh.esDiaDescanso(u, fecha)) {
      this.errorReposicion.set(
        'Ese día es laboral en tu horario. Solo puedes seleccionar un día de descanso.',
      );
    } else {
      this.errorReposicion.set(null);
    }
  }

  onSubmit(): void {
    const u = this.auth.currentUser();
    this.validarDiaDescanso();
    if (!u || this.form.invalid || this.errorReposicion()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const res = this.rrhh.crearSolicitud(u, {
      tipo: raw.tipo,
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin,
      reponerEnDescanso: raw.reponerEnDescanso,
      fechaReposicion: raw.fechaReposicion || undefined,
      horasExtrasSolicitadas:
        raw.tipo === 'Horas extras' ? Number(raw.horasExtrasSolicitadas || 1) : undefined,
      motivo: raw.motivo,
    });

    if (res.ok) {
      this.toast.success('Solicitud enviada', res.message);
      this.form.reset({
        tipo: 'Vacaciones',
        fechaInicio: this.hoy,
        fechaFin: this.hoy,
        reponerEnDescanso: false,
        fechaReposicion: '',
        horasExtrasSolicitadas: 1,
        motivo: '',
      });
      this.errorReposicion.set(null);
    } else {
      this.toast.error('Error en solicitud', res.message);
    }
  }
}
