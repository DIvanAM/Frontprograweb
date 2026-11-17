import { Component, computed, inject, signal } from '@angular/core';
import { EstatusSolicitud, SolicitudAusencia } from '../../../core/models/rrhh.models';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-solicitudes-admin',
  standalone: true,
  imports: [NavbarComponent],
  template: `
    <app-navbar />

    <main class="page-container">
      <!-- Page Header with Live Search (Screenshot 2) -->
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Monitor de Solicitudes de Ausencia</h1>
            <p class="page-subtitle">
              Bandeja de permisos y vacaciones para autorización de Recursos Humanos.
            </p>
          </div>
        </div>

        <div class="live-search-wrap">
          <div class="live-search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por matrícula o empleado en vivo..."
              [value]="searchText()"
              (input)="searchText.set($any($event.target).value)"
            />
            @if (searchText()) {
              <button type="button" class="clear-btn" (click)="searchText.set('')">×</button>
            }
          </div>
          <span class="search-caption">Filtro instantáneo en la tabla sin recargar.</span>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="status-bar">
        @for (tab of ['Pendiente', 'Aprobada', 'Rechazada', 'Todas']; track tab) {
          <button
            type="button"
            class="pill-btn"
            [class.active]="selectedFilter() === tab"
            (click)="selectedFilter.set(tab)"
          >
            {{ tab }}
          </button>
        }
      </div>

      <!-- Main Card (Screenshot 2) -->
      <section class="card card-accent-left" style="margin-top: 16px;">
        <div class="card-header">
          <div class="card-header-title">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Solicitudes de Permisos y Vacaciones</span>
          </div>
          <span class="badge badge-success badge-pill">{{ filteredSolicitudes().length }} Registros</span>
        </div>

        @if (filteredSolicitudes().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3>¡No hay solicitudes en esta categoría!</h3>
            <p>Todas las peticiones correspondientes han sido atendidas.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Periodo / Reposición</th>
                  <th>Motivo</th>
                  <th>Estatus</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (sol of filteredSolicitudes(); track sol.id) {
                  <tr>
                    <td>
                      <span class="badge-code">{{ sol.folio }}</span>
                      <div class="sub-cell">Mat: {{ sol.numeroEmpleado }}</div>
                    </td>
                    <td>
                      <strong>{{ sol.empleadoNombre }}</strong>
                      <div class="sub-cell">{{ sol.departamentoNombre }}</div>
                    </td>
                    <td><span class="badge badge-neutral">{{ sol.tipo }}</span></td>
                    <td>
                      {{ sol.fechaInicio }} al {{ sol.fechaFin }}
                      <div class="sub-cell">
                        {{ sol.diasSolicitados }} día(s)
                        @if (sol.horasExtrasSolicitadas) {
                          · {{ sol.horasExtrasSolicitadas }}h extra
                        }
                      </div>
                      @if (sol.reponerEnDescanso && sol.fechaReposicion) {
                        <div class="admin-note">Repone descanso: {{ sol.fechaReposicion }}</div>
                      }
                    </td>
                    <td class="motivo-cell">
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
                    <td>
                      @if (sol.estatus === 'Pendiente') {
                        <div class="btn-group">
                          <button
                            type="button"
                            class="btn btn-sm btn-success-outline"
                            (click)="openDecision(sol, 'Aprobada')"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            class="btn btn-sm btn-danger-outline"
                            (click)="openDecision(sol, 'Rechazada')"
                          >
                            Rechazar
                          </button>
                        </div>
                      } @else {
                        <span class="resolved-text">Procesada</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <!-- Optional Comment Modal -->
      @if (decisionTarget()) {
        <div class="modal-backdrop" (click)="decisionTarget.set(null)">
          <div class="modal-dialog" style="max-width: 460px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>
                {{ decisionType() === 'Aprobada' ? 'Aprobar Solicitud' : 'Rechazar Solicitud' }}
              </h3>
              <button type="button" class="btn btn-sm btn-outline" (click)="decisionTarget.set(null)">
                ×
              </button>
            </div>
            <div class="modal-body">
              <p style="margin: 0 0 12px;">
                Empleado: <strong>{{ decisionTarget()!.empleadoNombre }}</strong>
                ({{ decisionTarget()!.diasSolicitados }} día(s) de {{ decisionTarget()!.tipo }}).
              </p>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">Comentario / Observación de RH (opcional)</label>
                <textarea
                  rows="3"
                  class="form-control"
                  [value]="adminComment()"
                  (input)="adminComment.set($any($event.target).value)"
                  placeholder="Ej. Autorizado conforme a calendario de vacaciones..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="decisionTarget.set(null)">
                Cancelar
              </button>
              <button
                type="button"
                class="btn"
                [class.btn-primary]="decisionType() === 'Aprobada'"
                [class.btn-danger]="decisionType() === 'Rechazada'"
                (click)="confirmDecision()"
              >
                Confirmar {{ decisionType() === 'Aprobada' ? 'Aprobación' : 'Rechazo' }}
              </button>
            </div>
          </div>
        </div>
      }
    </main>
  `,
  styles: `
    .live-search-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .live-search-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 340px;
      max-width: 100%;

      svg {
        position: absolute;
        left: 11px;
        color: var(--color-text-muted);
      }

      .form-control {
        padding-left: 34px;
        padding-right: 32px;
      }

      .clear-btn {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        font-size: 1.1rem;
        color: var(--color-text-muted);
        cursor: pointer;
      }
    }

    .search-caption {
      font-size: 0.74rem;
      color: var(--color-text-muted);
    }

    .status-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pill-btn {
      padding: 6px 14px;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface);
      color: var(--color-text-secondary);
      cursor: pointer;

      &.active {
        background: var(--color-primary);
        border-color: var(--color-primary);
        color: #ffffff;
      }
    }

    .sub-cell {
      font-size: 0.76rem;
      color: var(--color-text-muted);
    }

    .motivo-cell {
      max-width: 260px;
      font-size: 0.82rem;
    }

    .admin-note {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--color-primary-dark);
      font-weight: 600;
    }

    .btn-group {
      display: flex;
      gap: 6px;
    }

    .resolved-text {
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }

    @media (max-width: 640px) {
      .live-search-wrap {
        width: 100%;
        align-items: stretch;
      }
      .live-search-box {
        width: 100%;
      }
    }
  `,
})
export class SolicitudesAdminComponent {
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly selectedFilter = signal<string>('Pendiente');
  readonly searchText = signal<string>('');
  readonly decisionTarget = signal<SolicitudAusencia | null>(null);
  readonly decisionType = signal<Extract<EstatusSolicitud, 'Aprobada' | 'Rechazada'>>('Aprobada');
  readonly adminComment = signal<string>('');

  readonly filteredSolicitudes = computed(() => {
    const f = this.selectedFilter();
    const q = this.searchText().trim().toLowerCase();

    return this.rrhh.solicitudes().filter((s) => {
      if (f !== 'Todas' && s.estatus !== f) return false;
      if (q) {
        if (
          !s.empleadoNombre.toLowerCase().includes(q) &&
          !s.numeroEmpleado.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  });

  openDecision(
    sol: SolicitudAusencia,
    type: Extract<EstatusSolicitud, 'Aprobada' | 'Rechazada'>,
  ): void {
    this.decisionTarget.set(sol);
    this.decisionType.set(type);
    this.adminComment.set('');
  }

  confirmDecision(): void {
    const target = this.decisionTarget();
    if (!target) return;
    const res = this.rrhh.resolverSolicitud(target.id, this.decisionType(), this.adminComment());
    if (res.ok) {
      this.toast.success(
        this.decisionType() === 'Aprobada' ? 'Solicitud Aprobada' : 'Solicitud Rechazada',
        res.message,
      );
      this.decisionTarget.set(null);
    }
  }
}
