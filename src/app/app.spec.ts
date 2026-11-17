import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { RrhhService } from './core/services/rrhh.service';

describe('Portal RRHH', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should generate initial password following rule', () => {
    const service = TestBed.inject(RrhhService);
    const pass = service.generarPasswordInicial('202607', 'Sofía', 'López');
    expect(pass).toBe('202SofLo');
  });

  it('should reject salary <= 0 and calculate strict schedule hours', () => {
    const service = TestBed.inject(RrhhService);
    expect(service.calcularHorasHorario('09:00', '17:00')).toBe(8);

    const res = service.crearEmpleado({
      numeroEmpleado: '202699',
      nombre: 'Ana',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'Díaz',
      correoInstitucional: 'ana.perez@empresa.mx',
      telefono: '5511223344',
      fechaIngreso: '2026-11-15',
      departamentoId: 1,
      puestoId: 1,
      salarioBase: 0,
      horaEntradaEstablecida: '09:00',
      horaSalidaEstablecida: '17:00',
      diasLaborales: ['L', 'M', 'Mi', 'J', 'V'],
      rol: 'EMPLEADO',
    });
    expect(res.ok).toBe(false);
  });

  it('should enforce 10 min tolerance and folio requirement on entry/exit', () => {
    const service = TestBed.inject(RrhhService);
    // Diego (id 2) has schedule 09:00 - 17:00 and approved FOL-2026-003 (Llegada tarde) & FOL-2026-004 (Salida temprano)
    const lateNoFolio = service.registrarEntrada(2, '', '09:15:00');
    expect(lateNoFolio.ok).toBe(false);
    expect(lateNoFolio.requiereFolio).toBe(true);

    const lateWithFolio = service.registrarEntrada(2, 'FOL-2026-003', '09:15:00');
    expect(lateWithFolio.ok).toBe(true);

    const earlyExitNoFolio = service.registrarSalida(2, '', '15:00:00');
    expect(earlyExitNoFolio.ok).toBe(false);
    expect(earlyExitNoFolio.requiereFolio).toBe(true);

    const earlyExitWithFolio = service.registrarSalida(2, 'FOL-2026-004', '15:00:00');
    expect(earlyExitWithFolio.ok).toBe(true);
  });

  it('should reject makeup day if it falls on a working day', () => {
    const service = TestBed.inject(RrhhService);
    const diego = service.empleados().find((e) => e.id === 2)!;
    // 2026-11-16 is Monday (working day for Diego)
    const res = service.crearSolicitud(diego, {
      tipo: 'Permiso sin goce',
      fechaInicio: '2026-11-17',
      fechaFin: '2026-11-17',
      reponerEnDescanso: true,
      fechaReposicion: '2026-11-16',
      motivo: 'Asunto personal',
    });
    expect(res.ok).toBe(false);
  });
});
