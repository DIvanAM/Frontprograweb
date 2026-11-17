import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ReciboNomina } from '../../../core/models/rrhh.models';
import { AuthService } from '../../../core/services/auth.service';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-empleado-recibos',
  standalone: true,
  imports: [NavbarComponent, CurrencyPipe],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Mis Recibos de Nómina Quincenal</h1>
            <p class="page-subtitle">
              Descarga tus recibos de sueldo y desglose de retenciones una vez aprobados por Recursos Humanos.
            </p>
          </div>
        </div>
      </div>

      <section class="card card-accent-left">
        <div class="card-header">
          <div class="card-header-title">
            <span>Recibos Liberados por Recursos Humanos</span>
            <span class="badge badge-dark">{{ misRecibosAprobados().length }} Disponibles</span>
          </div>
        </div>

        @if (misRecibosAprobados().length === 0) {
          <div class="empty-state">
            <h3>Aún no tienes recibos liberados</h3>
            <p>
              Los recibos de cada quincena estarán disponibles aquí únicamente cuando Recursos Humanos haya realizado y aprobado el corte de nómina.
            </p>
          </div>
        } @else {
          <div class="recibos-grid">
            @for (rec of misRecibosAprobados(); track rec.id) {
              <article class="recibo-card">
                <div class="recibo-head">
                  <div>
                    <span class="badge-code">{{ rec.corteId }}</span>
                    <h3>{{ rec.periodoLabel }}</h3>
                    <p class="sub-cell">Del {{ rec.fechaInicio }} al {{ rec.fechaFin }}</p>
                  </div>
                  <span class="badge badge-success">Aprobado RH</span>
                </div>

                <div class="recibo-breakdown">
                  <div class="line">
                    <span>Sueldo Bruto Quincenal</span>
                    <strong>{{ rec.sueldoBrutoQuincenal | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</strong>
                  </div>
                  @if (rec.pagoHorasExtras > 0) {
                    <div class="line">
                      <span>Horas Extras ({{ rec.horasExtrasPagadas }}h)</span>
                      <strong>+ {{ rec.pagoHorasExtras | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</strong>
                    </div>
                  }
                  <div class="line ded">
                    <span>ISR</span>
                    <span>- {{ rec.descuentoIsr | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</span>
                  </div>
                  <div class="line ded">
                    <span>IMSS</span>
                    <span>- {{ rec.descuentoImss | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</span>
                  </div>
                  @if (rec.descuentoInfonavit > 0) {
                    <div class="line ded">
                      <span>Crédito Infonavit</span>
                      <span>- {{ rec.descuentoInfonavit | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</span>
                    </div>
                  }
                  @if (rec.descuentoPrestamoEmpresa > 0) {
                    <div class="line ded">
                      <span>Préstamo Empresa</span>
                      <span>- {{ rec.descuentoPrestamoEmpresa | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</span>
                    </div>
                  }
                  @if (rec.descuentoIva > 0) {
                    <div class="line ded">
                      <span>IVA / Otros</span>
                      <span>- {{ rec.descuentoIva | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</span>
                    </div>
                  }
                  <div class="line total">
                    <span>Sueldo Neto Recibido</span>
                    <strong>{{ rec.sueldoNeto | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</strong>
                  </div>
                </div>

                <button type="button" class="btn btn-primary" (click)="descargarRecibo(rec)">
                  Descargar Recibo de Nómina
                </button>
              </article>
            }
          </div>
        }
      </section>
    </main>
  `,
  styles: `
    .recibos-grid {
      padding: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 18px;
    }

    .recibo-card {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 18px;
      background: var(--color-surface);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .recibo-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;

      h3 {
        margin: 6px 0 2px;
        font-size: 1rem;
      }
    }

    .sub-cell {
      margin: 0;
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }

    .recibo-breakdown {
      background: var(--color-surface-muted);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-size: 0.84rem;
    }

    .line {
      display: flex;
      justify-content: space-between;

      &.ded {
        color: #991b1b;
      }

      &.total {
        margin-top: 6px;
        padding-top: 8px;
        border-top: 1px solid var(--color-border-strong);
        font-size: 0.96rem;
        color: var(--color-primary-dark);
      }
    }
  `,
})
export class EmpleadoRecibosComponent {
  private readonly auth = inject(AuthService);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly misRecibosAprobados = computed(() => {
    const u = this.auth.currentUser();
    if (!u) return [];
    return this.rrhh
      .recibos()
      .filter((r) => r.empleadoId === u.id && r.aprobadoPorRh);
  });

  descargarRecibo(rec: ReciboNomina): void {
    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo de Nómina - ${rec.periodoLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111827; max-width: 720px; margin: auto; }
    h1 { color: #0b6637; margin-bottom: 4px; }
    .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    .right { text-align: right; }
    .total { font-weight: bold; font-size: 1.1em; color: #0b6637; }
  </style>
</head>
<body>
  <h1>Recibo de Nómina Quincenal</h1>
  <p><strong>Periodo:</strong> ${rec.periodoLabel} (${rec.fechaInicio} al ${rec.fechaFin})</p>
  <div class="box">
    <p><strong>Empleado:</strong> ${rec.empleadoNombre} (${rec.numeroEmpleado})</p>
    <p><strong>Departamento / Puesto:</strong> ${rec.departamento} — ${rec.puesto}</p>
    <p><strong>Aprobado por RH el:</strong> ${rec.fechaAprobacion ?? 'Confirmado'}</p>
  </div>
  <div class="box">
    <table>
      <tr><th>Concepto</th><th class="right">Importe (MXN)</th></tr>
      <tr><td>Sueldo Bruto Quincenal</td><td class="right">$${rec.sueldoBrutoQuincenal.toFixed(2)}</td></tr>
      <tr><td>Pago Horas Extras (${rec.horasExtrasPagadas}h)</td><td class="right">$${rec.pagoHorasExtras.toFixed(2)}</td></tr>
      <tr><td>Retención ISR</td><td class="right">-$${rec.descuentoIsr.toFixed(2)}</td></tr>
      <tr><td>Retención IMSS</td><td class="right">-$${rec.descuentoImss.toFixed(2)}</td></tr>
      <tr><td>Crédito Infonavit</td><td class="right">-$${rec.descuentoInfonavit.toFixed(2)}</td></tr>
      <tr><td>Préstamo de Empresa</td><td class="right">-$${rec.descuentoPrestamoEmpresa.toFixed(2)}</td></tr>
      <tr><td>IVA / Otros</td><td class="right">-$${rec.descuentoIva.toFixed(2)}</td></tr>
      <tr class="total"><td>SUELDO NETO A PAGAR</td><td class="right">$${rec.sueldoNeto.toFixed(2)}</td></tr>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recibo-${rec.numeroEmpleado}-${rec.corteId}.html`;
    link.click();
    URL.revokeObjectURL(url);

    this.toast.success('Recibo descargado', `Se descargó tu recibo de ${rec.periodoLabel}.`);
  }
}
