import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, Empleado, LoginRequest } from '../models/rrhh.models';
import { RrhhService } from './rrhh.service';

const SESSION_STORAGE_KEY = 'rrhh_active_session_v1';

export interface LoginResult {
  ok: boolean;
  message: string;
  requirePasswordChange?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly rrhh = inject(RrhhService);

  private readonly _session = signal<AuthSession | null>(this.restoreSession());

  readonly session = this._session.asReadonly();
  readonly currentUser = computed<Empleado | null>(() => this._session()?.empleado ?? null);
  readonly isAuthenticated = computed(() => !!this._session());
  readonly isAdmin = computed(() => this._session()?.empleado.rol === 'ADMIN');
  readonly requiresPasswordChange = computed(
    () => !!this._session()?.empleado.primerInicioSesion,
  );

  private restoreSession(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession | null): void {
    if (session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  /**
   * RF 1.1.1 (Inicio de sesión), RF 1.1.2 (Redirección por roles),
   * RF 1.1.4 (Cambio de contraseña obligatorio) y RN 3.3 (Bloqueo por estatus Inactivo).
   */
  login(credentials: LoginRequest): LoginResult {
    const record = this.rrhh.buscarPorCorreoMock(credentials.correoInstitucional);

    if (!record || record.passwordDemo !== credentials.password) {
      return {
        ok: false,
        message: 'Correo institucional o contraseña incorrectos.',
      };
    }

    if (record.estatus === 'Inactivo') {
      return {
        ok: false,
        message:
          'Acceso denegado: Tu cuenta se encuentra en estatus Inactivo. Contacta a Recursos Humanos.',
      };
    }

    const { passwordDemo: _p, ...empleadoSinPass } = record;
    const session: AuthSession = {
      token: `mock-jwt-${record.id}-${Date.now()}`,
      empleado: empleadoSinPass,
    };

    this._session.set(session);
    this.persistSession(session);

    // RF 1.1.4: Primer inicio de sesión obliga a cambiar contraseña
    if (empleadoSinPass.primerInicioSesion) {
      this.router.navigate(['/cambiar-password']);
      return {
        ok: true,
        message: 'Por seguridad, debes actualizar tu contraseña inicial.',
        requirePasswordChange: true,
      };
    }

    // RF 1.1.2: Redirección según rol
    this.redirectByRole(empleadoSinPass);
    return { ok: true, message: 'Bienvenido al Portal de Recursos Humanos.' };
  }

  redirectByRole(user: Empleado): void {
    if (user.rol === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/empleado/perfil']);
    }
  }

  /**
   * RF 1.1.4: Actualización obligatoria de contraseña en primer ingreso.
   */
  cambiarPasswordPrimerIngreso(nuevaPassword: string): { ok: boolean; message: string } {
    const user = this.currentUser();
    if (!user) {
      return { ok: false, message: 'No hay una sesión activa.' };
    }

    // Validar complejidad: mínimo 8 caracteres, mayúscula, minúscula y número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regex.test(nuevaPassword)) {
      return {
        ok: false,
        message:
          'La contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas y números.',
      };
    }

    this.rrhh.actualizarPasswordMock(user.id, nuevaPassword);
    const updatedUser: Empleado = { ...user, primerInicioSesion: false };
    const updatedSession: AuthSession = {
      token: this._session()!.token,
      empleado: updatedUser,
    };
    this._session.set(updatedSession);
    this.persistSession(updatedSession);

    this.redirectByRole(updatedUser);
    return { ok: true, message: 'Contraseña actualizada correctamente.' };
  }

  /**
   * Cambio voluntario de contraseña desde el perfil del empleado.
   * Requiere validar la contraseña anterior antes de establecer la nueva.
   */
  cambiarPasswordVoluntario(
    passwordActual: string,
    nuevaPassword: string,
  ): { ok: boolean; message: string } {
    const user = this.currentUser();
    if (!user) {
      return { ok: false, message: 'No hay una sesión activa.' };
    }

    const record = this.rrhh.buscarPorCorreoMock(user.correoInstitucional);
    if (!record || record.passwordDemo !== passwordActual) {
      return {
        ok: false,
        message: 'La contraseña actual ingresada no es correcta.',
      };
    }

    if (passwordActual === nuevaPassword) {
      return {
        ok: false,
        message: 'La nueva contraseña debe ser diferente a la contraseña actual.',
      };
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!regex.test(nuevaPassword)) {
      return {
        ok: false,
        message:
          'La nueva contraseña debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas y números.',
      };
    }

    this.rrhh.actualizarPasswordMock(user.id, nuevaPassword);
    return { ok: true, message: 'Tu contraseña se actualizó correctamente.' };
  }

  /**
   * RF 1.1.3: Cierre de sesión seguro.
   */
  logout(): void {
    this._session.set(null);
    this.persistSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.router.navigate(['/login']);
  }
}
