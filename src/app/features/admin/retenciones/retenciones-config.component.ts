import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-retenciones-config',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule],
  template: `
    <app-navbar />

    <main class="page-container">
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Configuración de Retenciones Fiscales y Legales</h1>
            <p class="page-subtitle">
              Ajuste de porcentajes de retención acorde a la legislación laboral y fiscal mexicana vigente.
            </p>
          </div>
        </div>
      </div>

      <div class="ret-layout">
        <section class="card card-accent-top">
          <div class="card-header">
            <h2 class="card-header-title">Porcentajes Aplicables en Corte de Nómina</h2>
            <span class="badge badge-neutral">México · LFT / LISR / LSS</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="guardar()" class="card-body" novalidate>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label" for="isr">
                  ISR — Impuesto Sobre la Renta (%) <span class="required">*</span>
                </label>
                <input
                  id="isr"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="form-control"
                  formControlName="isrPorcentaje"
                />
                <span class="form-hint">Retención salarial conforme a tablas del SAT.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="imss">
                  IMSS — Cuota Obrera (%) <span class="required">*</span>
                </label>
                <input
                  id="imss"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="form-control"
                  formControlName="imssPorcentaje"
                />
                <span class="form-hint">Aportación del trabajador al Seguro Social.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="infonavit">
                  Infonavit — Porcentaje Base (%) <span class="required">*</span>
                </label>
                <input
                  id="infonavit"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="form-control"
                  formControlName="infonavitPorcentaje"
                />
                <span class="form-hint">
                  Aplicado a empleados con crédito activo sin monto fijo quincenal.
                </span>
              </div>

              <div class="form-group">
                <label class="form-label" for="iva">
                  IVA / Otros Conceptos (%) <span class="required">*</span>
                </label>
                <input
                  id="iva"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  class="form-control"
                  formControlName="ivaPorcentaje"
                />
                <span class="form-hint">0% para nómina subordinada estándar; ajustable si aplica.</span>
              </div>
            </div>

            <div class="actions">
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid">
                Guardar Porcentajes de Retención
              </button>
            </div>
          </form>
        </section>

        <section class="card card-accent-left">
          <div class="card-header">
            <h2 class="card-header-title">Notas de Aplicación</h2>
          </div>
          <div class="card-body notes-body">
            <p>
              <strong>1. Aplicación automática:</strong> Al generar un nuevo corte quincenal en la pestaña
              <strong>Reporte</strong>, estos porcentajes se calculan sobre el sueldo bruto más horas extras aprobadas.
            </p>
            <p>
              <strong>2. Préstamos y Créditos individuales:</strong> Los descuentos por <em>Préstamo de Empresa</em> o
              <em>Crédito Infonavit</em> con cuota fija se configuran directamente en el perfil/tarjeta de cada empleado
              en el <strong>Directorio</strong>.
            </p>
            <p>
              <strong>3. Revisión previa:</strong> Recursos Humanos puede ajustar manualmente cualquier monto por empleado
              antes de aprobar y liberar los recibos quincenales.
            </p>
          </div>
        </section>
      </div>
    </main>
  `,
  styles: `
    .ret-layout {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      align-items: start;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      padding-top: 14px;
      border-top: 1px solid var(--color-border);
    }

    .notes-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      font-size: 0.86rem;
      color: var(--color-text-secondary);

      p {
        margin: 0;
      }
    }

    @media (max-width: 900px) {
      .ret-layout,
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class RetencionesConfigComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly form = this.fb.nonNullable.group({
    isrPorcentaje: [this.rrhh.retenciones().isrPorcentaje, [Validators.required, Validators.min(0)]],
    imssPorcentaje: [this.rrhh.retenciones().imssPorcentaje, [Validators.required, Validators.min(0)]],
    infonavitPorcentaje: [
      this.rrhh.retenciones().infonavitPorcentaje,
      [Validators.required, Validators.min(0)],
    ],
    ivaPorcentaje: [this.rrhh.retenciones().ivaPorcentaje, [Validators.required, Validators.min(0)]],
  });

  guardar(): void {
    if (this.form.invalid) return;
    const res = this.rrhh.actualizarRetenciones(this.form.getRawValue());
    if (res.ok) {
      this.toast.success('Retenciones actualizadas', res.message);
    } else {
      this.toast.error('Error', res.message);
    }
  }
}
