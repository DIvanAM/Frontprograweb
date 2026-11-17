import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../models/rrhh.models';
import { AuthService } from '../services/auth.service';

/**
 * RNF 2.1: Protege todas las rutas internas; si no hay sesión activa redirige a /login.
 * RF 1.1.4: Si es primer inicio de sesión, fuerza el paso por /cambiar-password.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.requiresPasswordChange()) {
    return router.createUrlTree(['/cambiar-password']);
  }

  return true;
};

/**
 * Guard exclusivo para la pantalla de cambio de contraseña obligatorio (RF 1.1.4).
 */
export const passwordChangeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!auth.requiresPasswordChange()) {
    const user = auth.currentUser()!;
    return router.createUrlTree([
      user.rol === 'ADMIN' ? '/admin/dashboard' : '/empleado/perfil',
    ]);
  }

  return true;
};

/**
 * RF 1.1.2 & RNF 2.1: Verifica que el rol del usuario coincida con la ruta solicitada.
 */
export const roleGuard = (requiredRole: RolUsuario): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();

    if (!user) {
      return router.createUrlTree(['/login']);
    }

    if (user.rol !== requiredRole) {
      return router.createUrlTree([
        user.rol === 'ADMIN' ? '/admin/dashboard' : '/empleado/perfil',
      ]);
    }

    return true;
  };
};

/**
 * Evita que un usuario ya autenticado vuelva al /login sin cerrar sesión.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.requiresPasswordChange()) {
    return router.createUrlTree(['/cambiar-password']);
  }

  const user = auth.currentUser()!;
  return router.createUrlTree([
    user.rol === 'ADMIN' ? '/admin/dashboard' : '/empleado/perfil',
  ]);
};
