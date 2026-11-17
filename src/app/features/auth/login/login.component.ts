import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-shell">
        <!-- Left Institutional Panel -->
        <div class="login-brand-panel">
          <div class="brand-header">
            <span class="brand-circle">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <div>
              <h1>Portal de Recursos Humanos</h1>
              <p>Gestión Integral de Personal, Asistencia y Solicitudes</p>
            </div>
          </div>

          <div class="demo-box">
            <div class="demo-title">Accesos rápidos de prueba</div>
            <p class="demo-desc">
              Selecciona un perfil para probar los flujos de acceso por rol, primer ingreso y cuenta inactiva:
            </p>
            <div class="demo-grid">
              <button type="button" class="demo-btn" (click)="fillDemo('admin.rh@empresa.mx', 'Admin123')">
                <strong>Admin RH</strong>
                <span>admin.rh@empresa.mx</span>
              </button>
              <button type="button" class="demo-btn" (click)="fillDemo('diego.alvarez@empresa.mx', 'Emp12345')">
                <strong>Empleado Activo</strong>
                <span>diego.alvarez@empresa.mx</span>
              </button>
              <button type="button" class="demo-btn demo-warn" (click)="fillDemo('sofia.ramirez@empresa.mx', '202SofLo')">
                <strong>Primer Ingreso</strong>
                <span>sofia.ramirez@empresa.mx</span>
              </button>
              <button type="button" class="demo-btn demo-danger" (click)="fillDemo('mariana.torres@empresa.mx', 'Inactivo1')">
                <strong>Cuenta Inactiva</strong>
                <span>mariana.torres@empresa.mx</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Login Form -->
        <div class="login-form-panel">
          <div class="form-head">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales institucionales para acceder al sistema.</p>
          </div>

          @if (errorMsg()) {
            <div class="alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{{ errorMsg() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="form-group">
              <label class="form-label" for="correo">
                Correo Electrónico Institucional <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="correo"
                  type="email"
                  class="form-control has-icon"
                  formControlName="correoInstitucional"
                  placeholder="nombre.apellido@empresa.mx"
                  [class.is-invalid]="isInvalid('correoInstitucional')"
                />
              </div>
              @if (isInvalid('correoInstitucional')) {
                <span class="form-error">
                  Ingresa un correo electrónico institucional válido.
                </span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="password">
                Contraseña <span class="required">*</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control has-icon"
                  style="padding-right: 42px;"
                  formControlName="password"
                  placeholder="Ingresa tu contraseña"
                  [class.is-invalid]="isInvalid('password')"
                />
                <button
                  type="button"
                  class="toggle-pass"
                  (click)="showPassword.set(!showPassword())"
                  tabindex="-1"
                >
                  {{ showPassword() ? 'Ocultar' : 'Ver' }}
                </button>
              </div>
              @if (isInvalid('password')) {
                <span class="form-error">La contraseña es obligatoria.</span>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-lg submit-btn">
              Entrar al Portal
            </button>
          </form>

          <p class="security-note">
            Tus credenciales se transmiten de forma segura y protegida en el servidor.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: `
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      background: linear-gradient(135deg, #f0f5f2 0%, #e5ede8 100%);
    }

    .login-shell {
      width: 100%;
      max-width: 960px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--color-border);
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      overflow: hidden;
    }

    .login-brand-panel {
      background: var(--color-primary);
      color: #ffffff;
      padding: 36px 32px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 28px;
    }

    .brand-header {
      display: flex;
      align-items: flex-start;
      gap: 14px;

      h1 {
        margin: 0 0 4px;
        font-size: 1.4rem;
        font-weight: 800;
        line-height: 1.2;
      }

      p {
        margin: 0;
        font-size: 0.88rem;
        color: rgba(255, 255, 255, 0.82);
      }
    }

    .brand-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #ffffff;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .demo-box {
      background: rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.18);
      border-radius: var(--radius-md);
      padding: 16px;
    }

    .demo-title {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-accent);
      margin-bottom: 4px;
    }

    .demo-desc {
      margin: 0 0 12px;
      font-size: 0.78rem;
      color: rgba(255, 255, 255, 0.82);
    }

    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .demo-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.22);
      color: #ffffff;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;

      strong {
        display: block;
        font-size: 0.78rem;
      }

      span {
        display: block;
        font-size: 0.7rem;
        opacity: 0.85;
        word-break: break-all;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      &.demo-warn {
        border-color: rgba(212, 175, 55, 0.6);
      }

      &.demo-danger {
        border-color: rgba(248, 113, 113, 0.6);
      }
    }

    .login-form-panel {
      padding: 40px 36px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .form-head {
      margin-bottom: 22px;

      h2 {
        margin: 0 0 4px;
        font-size: 1.45rem;
        font-weight: 800;
        color: var(--color-text);
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--color-text-muted);
      }
    }

    .alert-error {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      background: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: #991b1b;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .toggle-pass {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: var(--color-primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .submit-btn {
      width: 100%;
      margin-top: 8px;
    }

    .security-note {
      margin: 20px 0 0;
      font-size: 0.74rem;
      color: var(--color-text-muted);
      text-align: center;
    }

    @media (max-width: 820px) {
      .login-shell {
        grid-template-columns: 1fr;
      }

      .login-brand-panel,
      .login-form-panel {
        padding: 28px 20px;
      }

      .demo-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly errorMsg = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    correoInstitucional: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isInvalid(field: 'correoInstitucional' | 'password'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  fillDemo(correo: string, password: string): void {
    this.errorMsg.set(null);
    this.form.setValue({ correoInstitucional: correo, password });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg.set(null);
    const res = this.auth.login(this.form.getRawValue());
    if (!res.ok) {
      this.errorMsg.set(res.message);
    } else if (res.requirePasswordChange) {
      this.toast.warning('Primer inicio de sesión', res.message);
    } else {
      this.toast.success('Sesión iniciada', res.message);
    }
  }
}
