import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RrhhService } from '../../../core/services/rrhh.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="navbar-inner">
        <!-- Brand (matching reference screenshots) -->
        <a
          class="brand"
          [routerLink]="isAdmin() ? '/admin/dashboard' : '/empleado/perfil'"
        >
          <span class="brand-badge" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <span class="brand-text">PORTAL DE RECURSOS HUMANOS</span>
        </a>

        <!-- Mobile Menu Button -->
        <button
          type="button"
          class="mobile-toggle"
          (click)="mobileOpen.set(!mobileOpen())"
          [attr.aria-expanded]="mobileOpen()"
          aria-label="Abrir menú de navegación"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            @if (mobileOpen()) {
              <path d="M18 6 6 18M6 6l12 12"/>
            } @else {
              <path d="M3 12h18M3 6h18M3 18h18"/>
            }
          </svg>
        </button>

        <!-- Nav Links + User Actions -->
        <nav class="nav-content" [class.is-open]="mobileOpen()">
          <div class="nav-links">
            @if (isAdmin()) {
              <a
                routerLink="/admin/dashboard"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                <span>Resumen</span>
              </a>

              <a
                routerLink="/admin/empleados/nuevo"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                <span>Alta de Personal</span>
              </a>

              <a
                routerLink="/admin/empleados"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Directorio</span>
              </a>

              <a
                routerLink="/admin/catalogos"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
                <span>Catálogos</span>
              </a>

              <a
                routerLink="/admin/solicitudes"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>Solicitudes</span>
                @if (pendientesCount() > 0) {
                  <span class="nav-badge">{{ pendientesCount() }}</span>
                }
              </a>

              <a
                routerLink="/admin/reporte"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 20V10"/>
                  <path d="M12 20V4"/>
                  <path d="M6 20v-6"/>
                </svg>
                <span>Reporte</span>
              </a>

              <a
                routerLink="/admin/retenciones"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span>Retenciones</span>
              </a>
            } @else {
              <a
                routerLink="/empleado/perfil"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <span>Mi Perfil</span>
              </a>

              <a
                routerLink="/empleado/asistencia"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Asistencia</span>
              </a>

              <a
                routerLink="/empleado/solicitudes"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Mis Solicitudes</span>
              </a>

              <a
                routerLink="/empleado/recibos"
                routerLinkActive="active"
                class="nav-item"
                (click)="mobileOpen.set(false)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Mis Recibos</span>
              </a>
            }
          </div>

          <!-- User Info & Logout (RF 1.1.3) -->
          <div class="nav-user">
            <div class="user-chip">
              <span class="user-name">{{ fullName() }}</span>
              <span class="user-role">{{ isAdmin() ? 'Admin RH' : 'Empleado' }}</span>
            </div>
            <button
              type="button"
              class="logout-btn"
              (click)="auth.logout()"
              title="Cerrar sesión de forma segura"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: `
    .navbar {
      background: var(--color-primary);
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 20px;
      min-height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #ffffff;
      font-weight: 800;
      font-size: 0.98rem;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .brand-badge {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #ffffff;
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .mobile-toggle {
      display: none;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #ffffff;
      border-radius: 6px;
      padding: 6px 8px;
      cursor: pointer;
    }

    .nav-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      justify-content: flex-end;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .nav-item {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 8px 13px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-size: 0.84rem;
      font-weight: 500;
      transition: background 0.15s ease, color 0.15s ease;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      &.active {
        background: var(--color-accent);
        color: var(--color-accent-text);
        font-weight: 700;
      }
    }

    .nav-badge {
      background: var(--color-danger);
      color: #ffffff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 999px;
      line-height: 1.3;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-left: 12px;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
    }

    .user-chip {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      line-height: 1.2;
    }

    .user-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #ffffff;
    }

    .user-role {
      font-size: 0.68rem;
      color: var(--color-accent);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .logout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 11px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #ffffff;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: rgba(220, 38, 38, 0.85);
        border-color: rgba(220, 38, 38, 0.9);
      }
    }

    @media (max-width: 1024px) {
      .mobile-toggle {
        display: inline-flex;
      }

      .nav-content {
        display: none;
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        padding: 12px 0 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.15);

        &.is-open {
          display: flex;
        }
      }

      .nav-links {
        flex-direction: column;
        align-items: stretch;
      }

      .nav-user {
        border-left: none;
        border-top: 1px solid rgba(255, 255, 255, 0.15);
        padding: 12px 0 0;
        justify-content: space-between;
      }

      .user-chip {
        align-items: flex-start;
      }
    }
  `,
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly rrhh = inject(RrhhService);

  readonly mobileOpen = signal(false);
  readonly isAdmin = this.auth.isAdmin;
  readonly pendientesCount = this.rrhh.solicitudesPendientesCount;

  readonly fullName = computed(() => {
    const u = this.auth.currentUser();
    return u ? `${u.nombre} ${u.apellidoPaterno}` : '';
  });
}
