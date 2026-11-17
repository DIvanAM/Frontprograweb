import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('nuevaPassword')?.value;
  const confirm = group.get('confirmarPassword')?.value;
  return pass && confirm && pass !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="change-page">
      <div class="card card-accent-top change-card">
        <div class="card-header">
          <h2 class="card-header-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Cambio de Contraseña Obligatorio
          </h2>
          <span class="badge badge-warning-soft">Primer Ingreso</span>
        </div>

        <div class="card-body">
          <p class="intro">
            Hola <strong>{{ userName() }}</strong>, es tu primer inicio de sesión. Por seguridad,
            debes establecer una nueva contraseña personal antes de acceder a tu panel.
          </p>

          @if (errorMsg()) {
            <div class="alert-error">{{ errorMsg() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="form-group">
              <label class="form-label" for="nuevaPassword">
                Nueva Contraseña <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  id="nuevaPassword"
                  [type]="showNew() ? 'text' : 'password'"
                  class="form-control"
                  style="padding-right: 68px;"
                  formControlName="nuevaPassword"
                  (input)="passwordValue.set(form.controls.nuevaPassword.value)"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  class="toggle-pass"
                  (click)="showNew.set(!showNew())"
                  tabindex="-1"
                >
                  {{ showNew() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
            </div>

            <!-- Live Password Rules Checklist -->
            <ul class="rules-list">
              <li [class.ok]="hasMinLength()">
                <span>{{ hasMinLength() ? '✓' : '○' }}</span> Mínimo 8 caracteres
              </li>
              <li [class.ok]="hasUpper()">
                <span>{{ hasUpper() ? '✓' : '○' }}</span> Al menos una letra mayúscula (A-Z)
              </li>
              <li [class.ok]="hasLower()">
                <span>{{ hasLower() ? '✓' : '○' }}</span> Al menos una letra minúscula (a-z)
              </li>
              <li [class.ok]="hasNumber()">
                <span>{{ hasNumber() ? '✓' : '○' }}</span> Al menos un número (0-9)
              </li>
            </ul>

            <div class="form-group">
              <label class="form-label" for="confirmarPassword">
                Confirmar Nueva Contraseña <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <input
                  id="confirmarPassword"
                  [type]="showConfirm() ? 'text' : 'password'"
                  class="form-control"
                  style="padding-right: 68px;"
                  formControlName="confirmarPassword"
                  placeholder="Repite tu nueva contraseña"
                />
                <button
                  type="button"
                  class="toggle-pass"
                  (click)="showConfirm.set(!showConfirm())"
                  tabindex="-1"
                >
                  {{ showConfirm() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
              @if (form.errors?.['passwordMismatch'] && form.controls.confirmarPassword.touched) {
                <span class="form-error">Las contraseñas no coinciden.</span>
              }
            </div>

            <div class="actions">
              <button type="button" class="btn btn-outline" (click)="auth.logout()">
                Cancelar y Salir
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
                Guardar y Continuar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: `
    .change-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: var(--color-bg);
    }

    .change-card {
      width: 100%;
      max-width: 480px;
    }

    .intro {
      margin: 0 0 18px;
      font-size: 0.88rem;
      color: var(--color-text-secondary);
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

    .rules-list {
      list-style: none;
      padding: 12px 14px;
      margin: 0 0 16px;
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      display: grid;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--color-text-muted);

      li.ok {
        color: var(--color-success);
        font-weight: 600;
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
    }
  `,
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly errorMsg = signal<string | null>(null);
  readonly passwordValue = signal('');
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);

  readonly userName = computed(() => {
    const u = this.auth.currentUser();
    return u ? `${u.nombre} ${u.apellidoPaterno}` : '';
  });

  readonly hasMinLength = computed(() => this.passwordValue().length >= 8);
  readonly hasUpper = computed(() => /[A-Z]/.test(this.passwordValue()));
  readonly hasLower = computed(() => /[a-z]/.test(this.passwordValue()));
  readonly hasNumber = computed(() => /\d/.test(this.passwordValue()));

  readonly form = this.fb.nonNullable.group(
    {
      nuevaPassword: [
        '',
        [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)],
      ],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const res = this.auth.cambiarPasswordPrimerIngreso(this.form.controls.nuevaPassword.value);
    if (!res.ok) {
      this.errorMsg.set(res.message);
    } else {
      this.toast.success('Contraseña actualizada', res.message);
    }
  }
}
