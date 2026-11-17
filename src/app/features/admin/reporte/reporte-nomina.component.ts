import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReciboNomina } from '../../../core/models/rrhh.models';
import { RrhhService } from '../../../core/services/rrhh.service';
import { ToastService } from '../../../core/services/toast.service';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

interface FilaReporteNomina {
  numeroEmpleado: string;
  nombreCompleto: string;
  departamento: string;
  puesto: string;
  estatusCuenta: 'Activo' | 'Inactivo';
  horarioEstricto: string;
  diasLaboralesTexto: string;
  horasPorDia: number;
  diasPorSemana: number;
  horasEsperadas: number;
  diasTrabajados: number;
  horasTrabajadas: number;
  ausenciaResumen: string;
  diasJustificados: number;
  cumplimiento: 'Cumplió' | 'Justificado' | 'Incompleto' | 'Inactivo';
  salarioBaseMensual: number;
  pagoCorteEstimado: number;
}

@Component({
  selector: 'app-reporte-nomina',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, CurrencyPipe],
  template: `
    <app-navbar />

    <main class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title-group">
          <span class="page-title-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20V10"/>
              <path d="M12 20V4"/>
              <path d="M6 20v-6"/>
            </svg>
          </span>
          <div>
            <h1 class="page-title">Reporte Global & Corte de Nómina</h1>
            <p class="page-subtitle">
              Revisión de horas estrictas, permisos, reposición de descansos, retenciones y liberación de recibos quincenales.
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-outline" (click)="descargarCsv()">
            Descargar Reporte (CSV)
          </button>
          <button type="button" class="btn btn-primary" (click)="generarBorradorCorte()">
            Generar Borrador de Corte
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <section class="kpi-grid">
        <div class="kpi-card kpi-green">
          <div>
            <div class="kpi-label">Personal en Corte</div>
            <div class="kpi-value">{{ resumenKpis().totalActivos }}</div>
            <div class="kpi-sub">Empleados activos evaluados en el periodo</div>
          </div>
          <div class="kpi-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
        </div>

        <div class="kpi-card kpi-gold">
          <div>
            <div class="kpi-label">Jornada Cumplida / Justificada</div>
            <div class="kpi-value">{{ resumenKpis().cumplieron }}</div>
            <div class="kpi-sub">Listos para pago completo de nómina</div>
          </div>
          <div class="kpi-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>

        <div class="kpi-card kpi-red">
          <div>
            <div class="kpi-label">Monto Neto del Corte</div>
            <div class="kpi-value" style="font-size: 1.55rem;">
              {{ (corteActual().length > 0 ? totalNetoCorte() : resumenKpis().totalPago) | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}
            </div>
            <div class="kpi-sub">
              {{ corteActual().length > 0 ? 'Con retenciones aplicadas' : 'Estimado quincenal antes de retenciones' }}
            </div>
          </div>
          <div class="kpi-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
        </div>
      </section>

      <!-- Filters Card -->
      <section class="card filter-panel">
        <div class="filter-grid">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Nombre del Periodo (Quincena)</label>
            <input
              type="text"
              class="form-control"
              [value]="periodoLabel()"
              (input)="periodoLabel.set($any($event.target).value)"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Fecha Inicio</label>
            <input
              type="date"
              class="form-control"
              [value]="fechaInicio()"
              (change)="fechaInicio.set($any($event.target).value)"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Fecha Fin</label>
            <input
              type="date"
              class="form-control"
              [value]="fechaFin()"
              (change)="fechaFin.set($any($event.target).value)"
            />
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Departamento</label>
            <select
              class="form-control"
              [value]="selectedDepto()"
              (change)="selectedDepto.set(+$any($event.target).value)"
            >
              <option [value]="0">Todos los departamentos</option>
              @for (d of departamentos(); track d.id) {
                <option [value]="d.id">{{ d.nombre }}</option>
              }
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Buscar Empleado</label>
            <input
              type="text"
              class="form-control"
              placeholder="Nombre o matrícula..."
              [value]="searchText()"
              (input)="searchText.set($any($event.target).value)"
            />
          </div>
        </div>
      </section>

      <!-- Corte Quincenal Revisable y Aprobable -->
      @if (corteActual().length > 0) {
        <section class="card card-accent-top" style="margin-top: 18px;">
          <div class="card-header">
            <div class="card-header-title">
              <span>Revisión y Aprobación de Corte: {{ periodoLabel() }}</span>
              @if (corteAprobado()) {
                <span class="badge badge-success">Aprobado y Liberado</span>
              } @else {
                <span class="badge badge-warning-soft">Borrador (Pendiente de Aprobación)</span>
              }
            </div>

            @if (!corteAprobado()) {
              <button type="button" class="btn btn-primary btn-sm" (click)="aprobarCorte()">
                ✓ Aprobar y Liberar Recibos a Empleados
              </button>
            }
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Matrícula</th>
                  <th>Empleado</th>
                  <th>Bruto Qnal</th>
                  <th>Hrs Extras</th>
                  <th>ISR / IMSS / IVA</th>
                  <th>Infonavit / Préstamo</th>
                  <th>Neto a Pagar</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (rec of corteActual(); track rec.id) {
                  <tr>
                    <td><span class="badge-code">{{ rec.numeroEmpleado }}</span></td>
                    <td>
                      <strong>{{ rec.empleadoNombre }}</strong>
                      <div class="sub-cell">{{ rec.departamento }}</div>
                    </td>
                    <td>{{ rec.sueldoBrutoQuincenal | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</td>
                    <td>
                      {{ rec.pagoHorasExtras | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}
                      @if (rec.horasExtrasPagadas > 0) {
                        <div class="sub-cell">{{ rec.horasExtrasPagadas }}h</div>
                      }
                    </td>
                    <td>
                      <div class="sub-cell">ISR: {{ rec.descuentoIsr | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</div>
                      <div class="sub-cell">IMSS: {{ rec.descuentoImss | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</div>
                      @if (rec.descuentoIva > 0) {
                        <div class="sub-cell">IVA: {{ rec.descuentoIva | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</div>
                      }
                    </td>
                    <td>
                      <div class="sub-cell">Infonavit: {{ rec.descuentoInfonavit | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</div>
                      <div class="sub-cell">Préstamo: {{ rec.descuentoPrestamoEmpresa | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</div>
                    </td>
                    <td>
                      <strong class="pago-cell">
                        {{ rec.sueldoNeto | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}
                      </strong>
                    </td>
                    <td>
                      @if (!rec.aprobadoPorRh) {
                        <button type="button" class="btn btn-sm btn-outline" (click)="openEditRecibo(rec)">
                          Modificar
                        </button>
                      } @else {
                        <span class="badge badge-success-soft">Liberado</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <!-- Global Attendance & Schedule Compliance Table -->
      <section class="card card-accent-left" style="margin-top: 18px;">
        <div class="card-header">
          <div class="card-header-title">
            <span>Resumen de Asistencia, Horario Estricto y Ausencias</span>
            <span class="badge badge-dark">{{ filasFiltradas().length }} Empleados</span>
          </div>
          <span class="period-tag">Periodo: {{ fechaInicio() }} al {{ fechaFin() }}</span>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Matrícula</th>
                <th>Empleado</th>
                <th>Horario Estricto</th>
                <th>Días / Hrs Cumplidas</th>
                <th>Permisos / Vacaciones / Reposiciones</th>
                <th>Cumplimiento</th>
                <th>Salario Mensual</th>
              </tr>
            </thead>
            <tbody>
              @for (row of filasFiltradas(); track row.numeroEmpleado) {
                <tr>
                  <td><span class="badge-code">{{ row.numeroEmpleado }}</span></td>
                  <td>
                    <strong>{{ row.nombreCompleto }}</strong>
                    <div class="sub-cell">{{ row.departamento }} · {{ row.puesto }}</div>
                  </td>
                  <td>
                    <strong>{{ row.horarioEstricto }}</strong>
                    <div class="sub-cell">{{ row.diasLaboralesTexto }} ({{ row.horasEsperadas }}h/sem)</div>
                  </td>
                  <td>
                    <strong>{{ row.diasTrabajados }} día(s)</strong>
                    <div class="sub-cell">{{ row.horasTrabajadas }} hrs registradas</div>
                  </td>
                  <td>
                    @if (row.diasJustificados > 0) {
                      <span class="badge badge-warning-soft">{{ row.ausenciaResumen }}</span>
                    } @else {
                      <span class="sub-cell">{{ row.ausenciaResumen }}</span>
                    }
                  </td>
                  <td>
                    <span
                      class="badge"
                      [class.badge-success]="row.cumplimiento === 'Cumplió'"
                      [class.badge-warning-soft]="row.cumplimiento === 'Justificado'"
                      [class.badge-danger-soft]="row.cumplimiento === 'Incompleto'"
                      [class.badge-neutral]="row.cumplimiento === 'Inactivo'"
                    >
                      {{ row.cumplimiento }}
                    </span>
                  </td>
                  <td>{{ row.salarioBaseMensual | currency: 'MXN' : 'symbol-narrow' : '1.2-2' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Edit Individual Recibo Modal -->
      @if (editingRecibo()) {
        <div class="modal-backdrop" (click)="editingRecibo.set(null)">
          <div class="modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Ajustar Detalle de Corte — {{ editingRecibo()!.empleadoNombre }}</h3>
              <button type="button" class="btn btn-sm btn-outline" (click)="editingRecibo.set(null)">
                ×
              </button>
            </div>

            <form [formGroup]="editReciboForm" (ngSubmit)="saveReciboEdit()" novalidate>
              <div class="modal-body">
                <div class="modal-grid">
                  <div class="form-group">
                    <label class="form-label">Sueldo Bruto Quincenal</label>
                    <input type="number" step="0.01" class="form-control" formControlName="sueldoBrutoQuincenal" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Pago Horas Extras</label>
                    <input type="number" step="0.01" class="form-control" formControlName="pagoHorasExtras" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Descuento ISR</label>
                    <input type="number" step="0.01" class="form-control" formControlName="descuentoIsr" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Descuento IMSS</label>
                    <input type="number" step="0.01" class="form-control" formControlName="descuentoImss" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Crédito Infonavit</label>
                    <input type="number" step="0.01" class="form-control" formControlName="descuentoInfonavit" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Préstamo Empresa</label>
                    <input type="number" step="0.01" class="form-control" formControlName="descuentoPrestamoEmpresa" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">IVA / Otros</label>
                    <input type="number" step="0.01" class="form-control" formControlName="descuentoIva" />
                  </div>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">Observaciones de RH</label>
                  <input type="text" class="form-control" formControlName="notasRh" placeholder="Nota opcional para el recibo..." />
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-outline" (click)="editingRecibo.set(null)">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-primary">
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </main>
  `,
  styles: `
    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .filter-panel {
      padding: 16px 20px;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
      gap: 14px;
    }

    .period-tag {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .sub-cell {
      font-size: 0.76rem;
      color: var(--color-text-muted);
    }

    .pago-cell {
      color: var(--color-primary-dark);
    }

    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 600px) {
      .modal-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ReporteNominaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly rrhh = inject(RrhhService);
  private readonly toast = inject(ToastService);

  readonly departamentos = this.rrhh.departamentos;
  readonly periodoLabel = signal('1ra Quincena Noviembre 2026');
  readonly fechaInicio = signal('2026-11-01');
  readonly fechaFin = signal('2026-11-15');
  readonly selectedDepto = signal(0);
  readonly searchText = signal('');

  readonly editingRecibo = signal<ReciboNomina | null>(null);

  readonly editReciboForm = this.fb.nonNullable.group({
    sueldoBrutoQuincenal: [0, [Validators.required, Validators.min(0)]],
    pagoHorasExtras: [0, [Validators.required, Validators.min(0)]],
    descuentoIsr: [0, [Validators.required, Validators.min(0)]],
    descuentoImss: [0, [Validators.required, Validators.min(0)]],
    descuentoInfonavit: [0, [Validators.required, Validators.min(0)]],
    descuentoIva: [0, [Validators.required, Validators.min(0)]],
    descuentoPrestamoEmpresa: [0, [Validators.required, Validators.min(0)]],
    notasRh: [''],
  });

  readonly corteIdActual = computed(() => `CORTE-${this.fechaInicio()}-${this.fechaFin()}`);

  readonly corteActual = computed(() => {
    const id = this.corteIdActual();
    return this.rrhh.recibos().filter((r) => r.corteId === id);
  });

  readonly corteAprobado = computed(
    () => this.corteActual().length > 0 && this.corteActual().every((r) => r.aprobadoPorRh),
  );

  readonly totalNetoCorte = computed(() =>
    this.corteActual().reduce((sum, r) => sum + r.sueldoNeto, 0),
  );

  readonly filasReporte = computed<FilaReporteNomina[]>(() => {
    const ini = this.fechaInicio();
    const fin = this.fechaFin();
    const asistencias = this.rrhh.asistencias();
    const solicitudes = this.rrhh.solicitudes();

    return this.rrhh.empleados().map((emp) => {
      const asistEmp = asistencias.filter(
        (a) => a.empleadoId === emp.id && a.fecha >= ini && a.fecha <= fin,
      );
      const diasTrabajados = asistEmp.length;
      const horasTrabajadas =
        Math.round(
          asistEmp.reduce(
            (sum, a) => sum + this.rrhh.calcularHorasRegistro(a.horaEntrada, a.horaSalida),
            0,
          ) * 10,
        ) / 10;

      const solAprobadas = solicitudes.filter(
        (s) =>
          s.empleadoId === emp.id &&
          s.estatus === 'Aprobada' &&
          s.fechaFin >= ini &&
          s.fechaInicio <= fin,
      );

      const diasJustificados = solAprobadas.reduce((acc, s) => acc + s.diasSolicitados, 0);
      const ausenciaResumen =
        solAprobadas.length > 0
          ? solAprobadas
              .map(
                (s) =>
                  `${s.tipo} (${s.diasSolicitados}d${s.reponerEnDescanso && s.fechaReposicion ? ' · Repone ' + s.fechaReposicion : ''})`,
              )
              .join(', ')
          : 'Sin ausencias';

      const horasEsperadas = emp.horasPorDia * emp.diasPorSemana;
      const totalDiasCubiertos = diasTrabajados + diasJustificados;

      let cumplimiento: FilaReporteNomina['cumplimiento'] = 'Incompleto';
      if (emp.estatus === 'Inactivo') {
        cumplimiento = 'Inactivo';
      } else if (diasTrabajados >= emp.diasPorSemana || horasTrabajadas >= horasEsperadas) {
        cumplimiento = 'Cumplió';
      } else if (totalDiasCubiertos >= emp.diasPorSemana) {
        cumplimiento = 'Justificado';
      }

      const pagoQuincenalBase = emp.salarioBase / 2;
      const factor =
        emp.estatus === 'Inactivo'
          ? 0
          : Math.min(1, totalDiasCubiertos / Math.max(1, emp.diasPorSemana));
      const pagoCorteEstimado = Math.round(pagoQuincenalBase * factor * 100) / 100;

      return {
        numeroEmpleado: emp.numeroEmpleado,
        nombreCompleto: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno}`,
        departamento: emp.departamentoNombre ?? '',
        puesto: emp.puestoNombre ?? '',
        estatusCuenta: emp.estatus,
        horarioEstricto: `${emp.horaEntradaEstablecida} - ${emp.horaSalidaEstablecida}`,
        diasLaboralesTexto: emp.diasLaborales.join(' '),
        horasPorDia: emp.horasPorDia,
        diasPorSemana: emp.diasPorSemana,
        horasEsperadas,
        diasTrabajados,
        horasTrabajadas,
        ausenciaResumen,
        diasJustificados,
        cumplimiento,
        salarioBaseMensual: emp.salarioBase,
        pagoCorteEstimado,
      };
    });
  });

  readonly filasFiltradas = computed(() => {
    const depto = this.selectedDepto();
    const q = this.searchText().trim().toLowerCase();
    const empleados = this.rrhh.empleados();

    return this.filasReporte().filter((row) => {
      if (depto !== 0) {
        const emp = empleados.find((e) => e.numeroEmpleado === row.numeroEmpleado);
        if (emp && emp.departamentoId !== depto) return false;
      }
      if (q) {
        if (
          !row.nombreCompleto.toLowerCase().includes(q) &&
          !row.numeroEmpleado.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  });

  readonly resumenKpis = computed(() => {
    const rows = this.filasFiltradas();
    const activos = rows.filter((r) => r.estatusCuenta === 'Activo');
    const cumplieron = activos.filter(
      (r) => r.cumplimiento === 'Cumplió' || r.cumplimiento === 'Justificado',
    ).length;
    const totalPago = activos.reduce((sum, r) => sum + r.pagoCorteEstimado, 0);

    return {
      totalActivos: activos.length,
      cumplieron,
      totalPago,
    };
  });

  generarBorradorCorte(): void {
    const res = this.rrhh.generarCorteQuincenal(
      this.fechaInicio(),
      this.fechaFin(),
      this.periodoLabel(),
    );
    if (res.ok) {
      this.toast.success('Borrador generado', res.message);
    } else {
      this.toast.warning('Aviso de corte', res.message);
    }
  }

  openEditRecibo(rec: ReciboNomina): void {
    this.editingRecibo.set(rec);
    this.editReciboForm.setValue({
      sueldoBrutoQuincenal: rec.sueldoBrutoQuincenal,
      pagoHorasExtras: rec.pagoHorasExtras,
      descuentoIsr: rec.descuentoIsr,
      descuentoImss: rec.descuentoImss,
      descuentoInfonavit: rec.descuentoInfonavit,
      descuentoIva: rec.descuentoIva,
      descuentoPrestamoEmpresa: rec.descuentoPrestamoEmpresa,
      notasRh: rec.notasRh ?? '',
    });
  }

  saveReciboEdit(): void {
    const rec = this.editingRecibo();
    if (!rec || this.editReciboForm.invalid) return;
    const res = this.rrhh.actualizarReciboCorte(rec.id, this.editReciboForm.getRawValue());
    if (res.ok) {
      this.toast.success('Detalle actualizado', res.message);
      this.editingRecibo.set(null);
    }
  }

  aprobarCorte(): void {
    const res = this.rrhh.aprobarCorteQuincenal(this.corteIdActual());
    if (res.ok) {
      this.toast.success('Corte Aprobado y Liberado', res.message);
    }
  }

  descargarCsv(): void {
    const headers = [
      'Matrícula',
      'Empleado',
      'Departamento',
      'Puesto',
      'Horario Estricto',
      'Días Laborales',
      'Días Trabajados',
      'Horas Trabajadas',
      'Permisos/Vacaciones',
      'Cumplimiento',
      'Salario Mensual',
    ];

    const lines = this.filasFiltradas().map((r) =>
      [
        r.numeroEmpleado,
        `"${r.nombreCompleto}"`,
        `"${r.departamento}"`,
        `"${r.puesto}"`,
        `"${r.horarioEstricto}"`,
        `"${r.diasLaboralesTexto}"`,
        r.diasTrabajados,
        r.horasTrabajadas,
        `"${r.ausenciaResumen}"`,
        r.cumplimiento,
        r.salarioBaseMensual.toFixed(2),
      ].join(','),
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-nomina-${this.fechaInicio()}-a-${this.fechaFin()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.toast.success('Reporte descargado', 'El archivo CSV de corte de nómina se generó correctamente.');
  }
}
