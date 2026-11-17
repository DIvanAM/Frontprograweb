import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-empleado-asistencia',
  standalone: true,
  imports: [NavbarComponent, RouterLink],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Control de Asistencia</h1>
            <p class="page-subtitle">
              Registro diario de entrada (10 min de tolerancia) y salida conforme a tu horario estricto.
            </p>
          </div>
        </div>

        @if (user(); as u) {
          <span class="schedule-badge">
            Horario: {{ u.horaEntradaEstablecida }} - {{ u.horaSalidaEstablecida }} ·
            Días: {{ u.diasLaborales.join(' ') }}
          </span>
        }
      </div>

      <div class="asistencia-grid">
        <!-- Clock & Action Panel -->
        <section class="card card-accent-top">
          <div class="card-header">
            <h2 class="card-header-title">Reloj Checador del Día</h2>
            <span class="badge badge-neutral">{{ fechaHoy }}</span>
          </div>

          <div class="card-body clock-body">
            <div class="clock-display">{{ currentTime() }}</div>
            <p class="clock-note">
              Hora actual del sistema (Tolerancia de entrada: hasta 10 min después de tu hora)
            </p>

            <!-- Green Banner when clocked in without incidence -->
            @if (bannerSinIncidencias()) {
              <div class="banner-ok">
                ✓ {{ bannerSinIncidencias() }}
              </div>
            }

            <!-- Folio prompt for late arrival (>10 min) or early exit -->
            @if (requiereFolioEntrada()) {
              <div class="folio-box">
                <p class="folio-warn">
                  Has superado los 10 minutos de tolerancia. Registra tu incidencia ingresando el
                  <strong>folio</strong> de tu solicitud de <em>Llegada tarde</em>:
                </p>
                <div class="folio-input-row">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej. FOL-2026-003"
                    [value]="folioEntrada()"
                    (input)="folioEntrada.set($any($event.target).value)"
                  />
                  <button type="button" class="btn btn-primary" (click)="marcarEntrada()">
                    Validar y Entrar
                  </button>
                </div>
                <a routerLink="/empleado/solicitudes" class="folio-link">
                  ¿No tienes folio? Solicitar llegada tarde aquí →
                </a>
              </div>
            }

            @if (requiereFolioSalida()) {
              <div class="folio-box">
                <p class="folio-warn">
                  Aviso: Aún no es tu hora de salida establecida ({{ user()?.horaSalidaEstablecida }}).
                  Ingresa el <strong>folio de incidencia</strong> autorizado por RH para salir temprano:
                </p>
                <div class="folio-input-row">
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Ej. FOL-2026-004"
                    [value]="folioSalida()"
                    (input)="folioSalida.set($any($event.target).value)"
                  />
                  <button type="button" class="btn btn-accent" (click)="marcarSalida()">
                    Validar y Salir
                  </button>
                </div>
                <a routerLink="/empleado/solicitudes" class="folio-link">
                  ¿No tienes folio? Solicitar salida temprano aquí →
                </a>
              </div>
            }

            <div class="status-summary">
              <div class="status-pill-row">
                <span>Entrada de hoy:</span>
                <strong>{{ asistenciaHoy()?.horaEntrada ?? 'Sin registro' }}</strong>
              </div>
              <div class="status-pill-row">
                <span>Salida de hoy:</span>
                <strong>{{ asistenciaHoy()?.horaSalida ?? 'Sin registro' }}</strong>
              </div>
              @if (asistenciaHoy()?.incidenciaEntrada) {
                <div class="status-pill-row">
                  <span>Incidencia entrada:</span>
                  <strong>{{ asistenciaHoy()!.incidenciaEntrada }}</strong>
                </div>
              }
              @if (asistenciaHoy()?.incidenciaSalida) {
                <div class="status-pill-row">
                  <span>Incidencia salida:</span>
                  <strong>{{ asistenciaHoy()!.incidenciaSalida }}</strong>
                </div>
              }
            </div>

            <div class="checar-actions">
              <button
                type="button"
                class="btn btn-primary btn-lg"
                [disabled]="!!asistenciaHoy()?.horaEntrada"
                (click)="marcarEntrada()"
              >
                Registrar Entrada
              </button>

              <button
                type="button"
                class="btn btn-accent btn-lg"
                [disabled]="!asistenciaHoy()?.horaEntrada || !!asistenciaHoy()?.horaSalida"
                (click)="marcarSalida()"
              >
                Registrar Salida
              </button>
            </div>

            <!-- Overtime request button when exit >= 1 hr after scheduled exit -->
            @if (puedeSolicitarHorasExtras()) {
              <div class="overtime-box">
                <p>
                  Trabajaste <strong>{{ horasExtraDisponibles() }} hora(s) extra</strong> después de tu
                  horario establecido.
                </p>
                <button type="button" class="btn btn-primary btn-sm" (click)="solicitarHorasExtras()">
                  Solicitar Pago de Horas Extras a RH
                </button>
              </div>
            }
          </div>
        </section>

        <!-- Attendance History Table -->
        <section class="card card-accent-left">
          <div class="card-header">
            <h2 class="card-header-title">Historial de Asistencias</h2>
            <span class="badge badge-dark">{{ historial().length }} Registros</span>
          </div>

          @if (historial().length === 0) {
            <div class="empty-state">
              <h3>Sin registros previos</h3>
              <p>Tus entradas y salidas aparecerán aquí.</p>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Incidencias</th>
                    <th>Estatus</th>
                  </tr>
                </thead>
                <tbody>
                  @for (reg of historial(); track reg.id) {
                    <tr>
                      <td><strong>{{ reg.fecha }}</strong></td>
                      <td>{{ reg.horaEntrada ?? '—' }}</td>
                      <td>{{ reg.horaSalida ?? 'Pendiente' }}</td>
                      <td class="inc-cell">
                        <div>{{ reg.incidenciaEntrada || 'Sin incidencias' }}</div>
                        @if (reg.incidenciaSalida) {
                          <div class="sub-cell">{{ reg.incidenciaSalida }}</div>
                        }
                      </td>
                      <td>
                        <span
                          class="badge"
                          [class.badge-success]="reg.estatusDia === 'Completado'"
                          [class.badge-warning-soft]="reg.estatusDia === 'En jornada'"
                        >
                          {{ reg.estatusDia }}
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
    .schedule-badge {
      background: var(--color-primary-light);
      color: var(--color-primary-dark);
      border: 1px solid #bbf7d0;
      padding: 7px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 700;
    }

    .asistencia-grid {
      display: grid;
      grid-template-columns: 1fr 1.35fr;
      gap: 20px;
      align-items: start;
    }

    .clock-body {
      text-align: center;
    }

    .clock-display {
      font-family: var(--font-mono);
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--color-primary);
      letter-spacing: 0.04em;
      margin-bottom: 2px;
    }

    .clock-note {
      margin: 0 0 14px;
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }

    .banner-ok {
      background: var(--color-success-bg);
      color: #166534;
      border: 1px solid #86efac;
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 14px;
    }

    .folio-box {
      background: var(--color-warning-bg);
      border: 1px solid #fde68a;
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      text-align: left;
      margin-bottom: 14px;
    }

    .folio-warn {
      margin: 0 0 8px;
      font-size: 0.82rem;
      color: #92400e;
    }

    .folio-input-row {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }

    .folio-link {
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--color-primary-dark);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .status-summary {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      margin-bottom: 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .status-pill-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: var(--color-text-secondary);
    }

    .checar-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .overtime-box {
      margin-top: 14px;
      background: var(--color-primary-light);
      border: 1px solid #bbf7d0;
      border-radius: var(--radius-sm);
      padding: 12px 14px;

      p {
        margin: 0 0 8px;
        font-size: 0.83rem;
        color: var(--color-primary-dark);
      }
    }

    .inc-cell {
      font-size: 0.8rem;
    }

    .sub-cell {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    @media (max-width: 900px) {
      .asistencia-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class EmpleadoAsistenciaComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  private timerId?: ReturnType<typeof setInterval>;
  readonly currentTime = signal(this.rrhh.obtenerHoraActual());
  readonly fechaHoy = this.rrhh.obtenerFechaHoyISO();
  readonly user = computed(() => this.auth.currentUser());

  readonly folioEntrada = signal('');
  readonly folioSalida = signal('');
  readonly requiereFolioEntrada = signal(false);
  readonly requiereFolioSalida = signal(false);
  readonly bannerSinIncidencias = signal<string | null>(null);

  readonly asistenciaHoy = computed(() => {
    const u = this.auth.currentUser();
    return u ? this.rrhh.obtenerAsistenciaHoy(u.id) : undefined;
  });

  readonly historial = computed(() => {
    const u = this.auth.currentUser();
    return u ? this.rrhh.obtenerAsistenciasEmpleado(u.id) : [];
  });

  readonly horasExtraDisponibles = computed(() => {
    const hoy = this.asistenciaHoy();
    if (!hoy || !hoy.minutosExtra || hoy.minutosExtra < 60) return 0;
    return Math.floor(hoy.minutosExtra / 60);
  });

  readonly puedeSolicitarHorasExtras = computed(() => {
    const hoy = this.asistenciaHoy();
    return (
      !!hoy &&
      hoy.estatusDia === 'Completado' &&
      this.horasExtraDisponibles() >= 1 &&
      !hoy.horasExtrasSolicitadas
    );
  });

  ngOnInit(): void {
    this.timerId = setInterval(() => {
      this.currentTime.set(this.rrhh.obtenerHoraActual());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  marcarEntrada(): void {
    const u = this.auth.currentUser();
    if (!u) return;
    const res = this.rrhh.registrarEntrada(u.id, this.folioEntrada());
    if (res.ok) {
      this.requiereFolioEntrada.set(false);
      this.folioEntrada.set('');
      if (res.sinIncidencias) {
        this.bannerSinIncidencias.set(res.message);
      }
      this.toast.success('Entrada registrada', res.message);
    } else if (res.requiereFolio) {
      this.requiereFolioEntrada.set(true);
      this.toast.warning('Folio requerido', res.message);
    } else {
      this.toast.error('Operación no permitida', res.message);
    }
  }

  marcarSalida(): void {
    const u = this.auth.currentUser();
    if (!u) return;
    const res = this.rrhh.registrarSalida(u.id, this.folioSalida());
    if (res.ok) {
      this.requiereFolioSalida.set(false);
      this.folioSalida.set('');
      this.toast.success('Salida registrada', res.message);
    } else if (res.requiereFolio) {
      this.requiereFolioSalida.set(true);
      this.toast.warning('Folio de salida anticipada', res.message);
    } else {
      this.toast.error('Operación no permitida', res.message);
    }
  }

  solicitarHorasExtras(): void {
    const u = this.auth.currentUser();
    const hoy = this.asistenciaHoy();
    const horas = this.horasExtraDisponibles();
    if (!u || !hoy || horas < 1) return;

    const res = this.rrhh.crearSolicitud(u, {
      tipo: 'Horas extras',
      fechaInicio: hoy.fecha,
      fechaFin: hoy.fecha,
      horasExtrasSolicitadas: horas,
      motivo: `Solicitud de pago por ${horas} hora(s) extra trabajada(s) el ${hoy.fecha} (Salida: ${hoy.horaSalida}).`,
    });

    if (res.ok) {
      this.rrhh.marcarHorasExtrasSolicitadas(hoy.id);
      this.toast.success('Solicitud de horas extras enviada', res.message);
    } else {
      this.toast.error('Error', res.message);
    }
  }
}
