import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

function matchNewPasswords(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('nuevaPassword')?.value;
  const confirm = group.get('confirmarPassword')?.value;
  return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-empleado-perfil',
  standalone: true,
  imports: [NavbarComponent, RouterLink, ReactiveFormsModule, CurrencyPipe],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Mi Perfil Laboral</h1>
            <p class="page-subtitle">
              Consulta de información personal, jornada asignada y actualización de contraseña.
            </p>
          </div>
        </div>

        <div class="header-btns">
          <a routerLink="/empleado/asistencia" class="btn btn-primary">
            Registrar Asistencia
          </a>
          <a routerLink="/empleado/solicitudes" class="btn btn-outline">
            Solicitar Permiso / Vacaciones
          </a>
        </div>
      </div>

      @if (user(); as u) {
        <div class="profile-grid">
          <!-- Personal Info Card -->
          <section class="card card-accent-top">
            <div class="card-header">
              <h2 class="card-header-title">Información Personal</h2>
              <span class="badge-code">Matrícula: {{ u.numeroEmpleado }}</span>
            </div>
            <div class="card-body info-grid">
              <div class="info-field">
                <span class="field-label">Nombre Completo</span>
                <span class="field-value">{{ u.nombre }} {{ u.apellidoPaterno }} {{ u.apellidoMaterno }}</span>
              </div>
              <div class="info-field">
                <span class="field-label">Correo Institucional</span>
                <span class="field-value">{{ u.correoInstitucional }}</span>
              </div>
              <div class="info-field">
                <span class="field-label">Teléfono de Contacto</span>
                <span class="field-value">{{ u.telefono }}</span>
              </div>
              <div class="info-field">
                <span class="field-label">Estatus en Sistema</span>
                <span>
                  <span class="badge badge-success">{{ u.estatus }}</span>
                </span>
              </div>
            </div>
          </section>

          <!-- Labor Info Card -->
          <section class="card card-accent-top">
            <div class="card-header">
              <h2 class="card-header-title">Datos Laborales y Jornada</h2>
              <span class="badge badge-neutral">Solo Lectura</span>
            </div>
            <div class="card-body info-grid">
              <div class="info-field">
                <span class="field-label">Departamento</span>
                <span class="field-value">{{ u.departamentoNombre }}</span>
              </div>
              <div class="info-field">
                <span class="field-label">Puesto Actual</span>
                <span class="field-value">{{ u.puestoNombre }}</span>
              </div>
              <div class="info-field">
                <span class="field-label">Horario Estricto</span>
                <span class="field-value">
                  {{ u.horaEntradaEstablecida }} - {{ u.horaSalidaEstablecida }} ({{ u.horasPorDia }} hrs/día)
                </span>
              </div>
              <div class="info-field">
                <span class="field-label">Días Laborales</span>
                <span class="field-value">{{ u.diasLaborales.join(' · ') }}</span>
              </div>
              <div class="info-field">
                <span class="field-label">Salario Base Mensual</span>
                <span class="field-value salary">
                  {{ u.salarioBase | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}
                </span>
              </div>
            </div>
          </section>
        </div>

        <!-- Change Password Card -->
        <section class="card card-accent-left" style="margin-top: 20px;">
          <div class="card-header">
            <h2 class="card-header-title">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Seguridad y Cambio de Contraseña
            </h2>
          </div>

          <form [formGroup]="passForm" (ngSubmit)="onChangePassword()" class="card-body" novalidate>
            @if (passError()) {
              <div class="alert-error">{{ passError() }}</div>
            }

            <div class="pass-grid">
              <div class="form-group">
                <label class="form-label" for="actual">
                  Contraseña Actual <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <input
                    id="actual"
                    [type]="showActual() ? 'text' : 'password'"
                    class="form-control"
                    style="padding-right: 68px;"
                    formControlName="passwordActual"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <button
                    type="button"
                    class="toggle-pass"
                    (click)="showActual.set(!showActual())"
                    tabindex="-1"
                  >
                    {{ showActual() ? 'Ocultar' : 'Ver' }}
                  </button>
                </div>
                @if (passForm.controls.passwordActual.invalid && passForm.controls.passwordActual.touched) {
                  <span class="form-error">Debes ingresar tu contraseña actual.</span>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="nueva">
                  Nueva Contraseña <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <input
                    id="nueva"
                    [type]="showNueva() ? 'text' : 'password'"
                    class="form-control"
                    style="padding-right: 68px;"
                    formControlName="nuevaPassword"
                    (input)="newPassValue.set(passForm.controls.nuevaPassword.value)"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    class="toggle-pass"
                    (click)="showNueva.set(!showNueva())"
                    tabindex="-1"
                  >
                    {{ showNueva() ? 'Ocultar' : 'Ver' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="confirmar">
                  Confirmar Nueva Contraseña <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                  <input
                    id="confirmar"
                    [type]="showConfirmar() ? 'text' : 'password'"
                    class="form-control"
                    style="padding-right: 68px;"
                    formControlName="confirmarPassword"
                    placeholder="Repite la nueva contraseña"
                  />
                  <button
                    type="button"
                    class="toggle-pass"
                    (click)="showConfirmar.set(!showConfirmar())"
                    tabindex="-1"
                  >
                    {{ showConfirmar() ? 'Ocultar' : 'Ver' }}
                  </button>
                </div>
                @if (passForm.errors?.['passwordMismatch'] && passForm.controls.confirmarPassword.touched) {
                  <span class="form-error">Las contraseñas nuevas no coinciden.</span>
                }
              </div>
            </div>

            <div class="rules-bar">
              <span [class.ok]="hasMinLength()">{{ hasMinLength() ? '✓' : '○' }} Mín. 8 caracteres</span>
              <span [class.ok]="hasUpper()">{{ hasUpper() ? '✓' : '○' }} 1 Mayúscula</span>
              <span [class.ok]="hasLower()">{{ hasLower() ? '✓' : '○' }} 1 Minúscula</span>
              <span [class.ok]="hasNumber()">{{ hasNumber() ? '✓' : '○' }} 1 Número</span>
            </div>

            <div class="pass-actions">
              <button type="submit" class="btn btn-primary" [disabled]="passForm.invalid">
                Actualizar Contraseña
              </button>
            </div>
          </form>
        </section>
      }
    </main>
  `,
  styles: `
    .header-btns {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .info-field {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-text-muted);
    }

    .field-value {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--color-text);
      word-break: break-word;

      &.salary {
        color: var(--color-primary-dark);
        font-weight: 800;
      }
    }

    .pass-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    .toggle-pass {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
    }

    .alert-error {
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: #991b1b;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      margin-bottom: 14px;
    }

    .rules-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 10px 14px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-bottom: 14px;

      span.ok {
        color: var(--color-success);
        font-weight: 600;
      }
    }

    .pass-actions {
      display: flex;
      justify-content: flex-end;
    }

    @media (max-width: 900px) {
      .profile-grid,
      .pass-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EmpleadoPerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly user = computed(() => this.auth.currentUser());

  readonly passError = signal<string | null>(null);
  readonly newPassValue = signal('');
  readonly showActual = signal(false);
  readonly showNueva = signal(false);
  readonly showConfirmar = signal(false);

  readonly hasMinLength = computed(() => this.newPassValue().length >= 8);
  readonly hasUpper = computed(() => /[A-Z]/.test(this.newPassValue()));
  readonly hasLower = computed(() => /[a-z]/.test(this.newPassValue()));
  readonly hasNumber = computed(() => /\d/.test(this.newPassValue()));

  readonly passForm = this.fb.nonNullable.group(
    {
      passwordActual: ['', [Validators.required]],
      nuevaPassword: [
        '',
        [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)],
      ],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: matchNewPasswords },
  );

  onChangePassword(): void {
    if (this.passForm.invalid) {
      this.passForm.markAllAsTouched();
      return;
    }

    this.passError.set(null);
    const { passwordActual, nuevaPassword } = this.passForm.getRawValue();
    const res = this.auth.cambiarPasswordVoluntario(passwordActual, nuevaPassword);

    if (!res.ok) {
      this.passError.set(res.message);
      return;
    }

    this.toast.success('Contraseña actualizada', res.message);
    this.passForm.reset({
      passwordActual: '',
      nuevaPassword: '',
      confirmarPassword: '',
    });
    this.newPassValue.set('');
  }
}
