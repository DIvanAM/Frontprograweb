import { Injectable, computed, signal } from '@angular/core';
import {
  ConfiguracionRetenciones,
  CrearEmpleadoDto,
  CrearSolicitudDto,
  Departamento,
  DiaSemana,
  Empleado,
  EstatusSolicitud,
  Puesto,
  ReciboNomina,
  RegistroAsistencia,
  SolicitudAusencia,
} from '../models/rrhh.models';
import {
  DIAS_SEMANA_ORDEN,
  EmpleadoMockRecord,
  INITIAL_ASISTENCIAS,
  INITIAL_DEPARTAMENTOS,
  INITIAL_EMPLEADOS,
  INITIAL_PUESTOS,
  INITIAL_RECIBOS,
  INITIAL_RETENCIONES,
  INITIAL_SOLICITUDES,
} from './rrhh-mock.data';

export interface ActionResult<T = void> {
  ok: boolean;
  message: string;
  data?: T;
  requiereFolio?: boolean;
  sinIncidencias?: boolean;
}

@Injectable({ providedIn: 'root' })
export class RrhhService {
  private readonly _departamentos = signal<Departamento[]>([...INITIAL_DEPARTAMENTOS]);
  private readonly _puestos = signal<Puesto[]>([...INITIAL_PUESTOS]);
  private readonly _empleados = signal<EmpleadoMockRecord[]>([...INITIAL_EMPLEADOS]);
  private readonly _asistencias = signal<RegistroAsistencia[]>([...INITIAL_ASISTENCIAS]);
  private readonly _solicitudes = signal<SolicitudAusencia[]>([...INITIAL_SOLICITUDES]);
  private readonly _retenciones = signal<ConfiguracionRetenciones>({ ...INITIAL_RETENCIONES });
  private readonly _recibos = signal<ReciboNomina[]>([...INITIAL_RECIBOS]);

  readonly departamentos = this._departamentos.asReadonly();
  readonly puestos = this._puestos.asReadonly();
  readonly empleados = computed<Empleado[]>(() =>
    this._empleados().map(({ passwordDemo: _p, ...emp }) => emp),
  );
  readonly asistencias = this._asistencias.asReadonly();
  readonly solicitudes = this._solicitudes.asReadonly();
  readonly retenciones = this._retenciones.asReadonly();
  readonly recibos = this._recibos.asReadonly();

  readonly solicitudesPendientesCount = computed(
    () => this._solicitudes().filter((s) => s.estatus === 'Pendiente').length,
  );

  // =========================================================================
  // Helpers de Horario Estricto y Días de Descanso
  // =========================================================================
  calcularHorasHorario(horaEntrada: string, horaSalida: string): number {
    if (!horaEntrada || !horaSalida) return 0;
    const [h1, m1] = horaEntrada.split(':').map(Number);
    const [h2, m2] = horaSalida.split(':').map(Number);
    const min1 = (h1 || 0) * 60 + (m1 || 0);
    const min2 = (h2 || 0) * 60 + (m2 || 0);
    if (min2 <= min1) return 0;
    return Math.round(((min2 - min1) / 60) * 10) / 10;
  }

  private timeToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  obtenerDiaSemanaDeFecha(fechaISO: string): DiaSemana | null {
    if (!fechaISO) return null;
    const date = new Date(fechaISO + 'T12:00:00');
    const jsDay = date.getDay();
    return DIAS_SEMANA_ORDEN.find((d) => d.jsDay === jsDay)?.key ?? null;
  }

  esDiaDescanso(empleado: Empleado, fechaISO: string): boolean {
    const dia = this.obtenerDiaSemanaDeFecha(fechaISO);
    if (!dia) return false;
    return !empleado.diasLaborales.includes(dia);
  }

  // =========================================================================
  // Generación automática de contraseña inicial
  // =========================================================================
  generarPasswordInicial(
    numeroEmpleado: string,
    nombre: string,
    apellidoMaterno: string,
  ): string {
    const digitos = numeroEmpleado.replace(/\D/g, '').slice(0, 3).padEnd(3, '0');
    const cleanText = (v: string) =>
      v
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '');

    const nom = cleanText(nombre).slice(0, 3);
    const nomFormatted = nom ? nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase() : 'Emp';

    const apMat = cleanText(apellidoMaterno).slice(0, 2);
    const apMatFormatted = apMat ? apMat.charAt(0).toUpperCase() + apMat.slice(1).toLowerCase() : 'Xx';

    return `${digitos}${nomFormatted}${apMatFormatted}`;
  }

  // =========================================================================
  // Autenticación interna contra almacén (para modo mock)
  // =========================================================================
  buscarPorCorreoMock(correo: string): EmpleadoMockRecord | undefined {
    const normalized = correo.trim().toLowerCase();
    return this._empleados().find(
      (e) => e.correoInstitucional.toLowerCase() === normalized,
    );
  }

  actualizarPasswordMock(empleadoId: number, nuevaPassword: string): void {
    this._empleados.update((list) =>
      list.map((e) =>
        e.id === empleadoId
          ? { ...e, passwordDemo: nuevaPassword, primerInicioSesion: false }
          : e,
      ),
    );
  }

  // =========================================================================
  // CRUD de Empleados + Horario Estricto + Créditos/Préstamos + Baja Lógica
  // =========================================================================
  crearEmpleado(
    dto: CrearEmpleadoDto,
  ): ActionResult<{ empleado: Empleado; passwordInicial: string }> {
    if (!dto.salarioBase || Number(dto.salarioBase) <= 0) {
      return { ok: false, message: 'El salario base debe ser estrictamente mayor a $0.00.' };
    }

    const horasPorDia = this.calcularHorasHorario(
      dto.horaEntradaEstablecida,
      dto.horaSalidaEstablecida,
    );
    if (horasPorDia <= 0) {
      return {
        ok: false,
        message: 'La hora de salida establecida debe ser posterior a la hora de entrada.',
      };
    }

    if (!dto.diasLaborales || dto.diasLaborales.length === 0) {
      return { ok: false, message: 'Debes seleccionar al menos un día laboral en la semana.' };
    }

    const existeCorreo = this._empleados().some(
      (e) => e.correoInstitucional.toLowerCase() === dto.correoInstitucional.trim().toLowerCase(),
    );
    if (existeCorreo) {
      return { ok: false, message: 'Ya existe un empleado con ese correo institucional.' };
    }

    const existeMatricula = this._empleados().some(
      (e) => e.numeroEmpleado.trim() === dto.numeroEmpleado.trim(),
    );
    if (existeMatricula) {
      return { ok: false, message: 'Ya existe un empleado con ese número de matrícula.' };
    }

    const depto = this._departamentos().find((d) => d.id === Number(dto.departamentoId));
    const puesto = this._puestos().find((p) => p.id === Number(dto.puestoId));
    const passwordInicial = this.generarPasswordInicial(
      dto.numeroEmpleado,
      dto.nombre,
      dto.apellidoMaterno,
    );

    const nextId = Math.max(0, ...this._empleados().map((e) => e.id)) + 1;
    const nuevo: EmpleadoMockRecord = {
      id: nextId,
      numeroEmpleado: dto.numeroEmpleado.trim(),
      nombre: dto.nombre.trim(),
      apellidoPaterno: dto.apellidoPaterno.trim(),
      apellidoMaterno: dto.apellidoMaterno.trim(),
      correoInstitucional: dto.correoInstitucional.trim().toLowerCase(),
      telefono: dto.telefono.trim(),
      fechaNacimiento: dto.fechaNacimiento,
      fechaIngreso: dto.fechaIngreso,
      departamentoId: Number(dto.departamentoId),
      departamentoNombre: depto?.nombre ?? '',
      puestoId: Number(dto.puestoId),
      puestoNombre: puesto?.nombre ?? '',
      salarioBase: Number(dto.salarioBase),
      horaEntradaEstablecida: dto.horaEntradaEstablecida,
      horaSalidaEstablecida: dto.horaSalidaEstablecida,
      horasPorDia,
      diasLaborales: [...dto.diasLaborales],
      diasPorSemana: dto.diasLaborales.length,
      tienePrestamoEmpresa: !!dto.tienePrestamoEmpresa,
      montoPrestamoQuincenal: dto.tienePrestamoEmpresa ? Number(dto.montoPrestamoQuincenal || 0) : 0,
      tieneCreditoInfonavit: !!dto.tieneCreditoInfonavit,
      descuentoInfonavitQuincenal: dto.tieneCreditoInfonavit ? Number(dto.descuentoInfonavitQuincenal || 0) : 0,
      rol: dto.rol,
      estatus: 'Activo',
      primerInicioSesion: true,
      passwordDemo: passwordInicial,
    };

    this._empleados.update((list) => [nuevo, ...list]);
    const { passwordDemo: _p, ...empleadoSinPass } = nuevo;

    return {
      ok: true,
      message: 'Empleado registrado correctamente.',
      data: { empleado: empleadoSinPass, passwordInicial },
    };
  }

  actualizarEmpleado(id: number, cambios: Partial<CrearEmpleadoDto>): ActionResult<Empleado> {
    if (cambios.salarioBase !== undefined && Number(cambios.salarioBase) <= 0) {
      return { ok: false, message: 'El salario base debe ser estrictamente mayor a $0.00.' };
    }

    const depto = cambios.departamentoId
      ? this._departamentos().find((d) => d.id === Number(cambios.departamentoId))
      : undefined;
    const puesto = cambios.puestoId
      ? this._puestos().find((p) => p.id === Number(cambios.puestoId))
      : undefined;

    let actualizado: Empleado | undefined;
    let errorHorario: string | null = null;

    this._empleados.update((list) =>
      list.map((e) => {
        if (e.id !== id) return e;
        const entrada = cambios.horaEntradaEstablecida ?? e.horaEntradaEstablecida;
        const salida = cambios.horaSalidaEstablecida ?? e.horaSalidaEstablecida;
        const horasPorDia = this.calcularHorasHorario(entrada, salida);
        if (horasPorDia <= 0) {
          errorHorario = 'La hora de salida debe ser posterior a la hora de entrada.';
          return e;
        }
        const diasLaborales = cambios.diasLaborales ?? e.diasLaborales;
        if (diasLaborales.length === 0) {
          errorHorario = 'Debes seleccionar al menos un día laboral.';
          return e;
        }

        const tienePrestamo =
          cambios.tienePrestamoEmpresa !== undefined
            ? cambios.tienePrestamoEmpresa
            : e.tienePrestamoEmpresa;
        const tieneInfonavit =
          cambios.tieneCreditoInfonavit !== undefined
            ? cambios.tieneCreditoInfonavit
            : e.tieneCreditoInfonavit;

        const merged: EmpleadoMockRecord = {
          ...e,
          ...cambios,
          departamentoId: cambios.departamentoId ? Number(cambios.departamentoId) : e.departamentoId,
          departamentoNombre: depto ? depto.nombre : e.departamentoNombre,
          puestoId: cambios.puestoId ? Number(cambios.puestoId) : e.puestoId,
          puestoNombre: puesto ? puesto.nombre : e.puestoNombre,
          salarioBase: cambios.salarioBase !== undefined ? Number(cambios.salarioBase) : e.salarioBase,
          horaEntradaEstablecida: entrada,
          horaSalidaEstablecida: salida,
          horasPorDia,
          diasLaborales: [...diasLaborales],
          diasPorSemana: diasLaborales.length,
          tienePrestamoEmpresa: tienePrestamo,
          montoPrestamoQuincenal: tienePrestamo
            ? Number(cambios.montoPrestamoQuincenal ?? e.montoPrestamoQuincenal)
            : 0,
          tieneCreditoInfonavit: tieneInfonavit,
          descuentoInfonavitQuincenal: tieneInfonavit
            ? Number(cambios.descuentoInfonavitQuincenal ?? e.descuentoInfonavitQuincenal)
            : 0,
        };
        const { passwordDemo: _p, ...clean } = merged;
        actualizado = clean;
        return merged;
      }),
    );

    if (errorHorario) {
      return { ok: false, message: errorHorario };
    }
    if (!actualizado) {
      return { ok: false, message: 'Empleado no encontrado.' };
    }

    return { ok: true, message: 'Información del empleado actualizada.', data: actualizado };
  }

  cambiarEstatusEmpleado(id: number, nuevoEstatus: 'Activo' | 'Inactivo'): ActionResult {
    this._empleados.update((list) =>
      list.map((e) => (e.id === id ? { ...e, estatus: nuevoEstatus } : e)),
    );
    return {
      ok: true,
      message:
        nuevoEstatus === 'Inactivo'
          ? 'Empleado dado de baja lógica (estatus: Inactivo).'
          : 'Empleado reactivado correctamente.',
    };
  }

  // =========================================================================
  // Catálogos de Departamentos y Puestos
  // =========================================================================
  crearDepartamento(nombre: string, descripcion: string): ActionResult<Departamento> {
    const cleanName = nombre.trim();
    if (!cleanName) return { ok: false, message: 'El nombre del departamento es obligatorio.' };
    if (this._departamentos().some((d) => d.nombre.toLowerCase() === cleanName.toLowerCase())) {
      return { ok: false, message: 'Ya existe un departamento con ese nombre.' };
    }

    const nextId = Math.max(0, ...this._departamentos().map((d) => d.id)) + 1;
    const nuevo: Departamento = { id: nextId, nombre: cleanName, descripcion: descripcion.trim(), activo: true };
    this._departamentos.update((list) => [...list, nuevo]);
    return { ok: true, message: 'Departamento creado correctamente.', data: nuevo };
  }

  editarDepartamento(id: number, nombre: string, descripcion: string): ActionResult {
    const cleanName = nombre.trim();
    if (!cleanName) return { ok: false, message: 'El nombre del departamento es obligatorio.' };

    this._departamentos.update((list) =>
      list.map((d) => (d.id === id ? { ...d, nombre: cleanName, descripcion: descripcion.trim() } : d)),
    );
    this._puestos.update((list) =>
      list.map((p) => (p.departamentoId === id ? { ...p, departamentoNombre: cleanName } : p)),
    );
    this._empleados.update((list) =>
      list.map((e) => (e.departamentoId === id ? { ...e, departamentoNombre: cleanName } : e)),
    );
    return { ok: true, message: 'Departamento actualizado.' };
  }

  eliminarDepartamento(id: number): ActionResult {
    const empleadosVinculados = this._empleados().filter((e) => e.departamentoId === id).length;
    if (empleadosVinculados > 0) {
      return {
        ok: false,
        message: `No se puede eliminar este departamento porque tiene ${empleadosVinculados} empleado(s) vinculado(s).`,
      };
    }

    const puestosVinculados = this._puestos().filter((p) => p.departamentoId === id).length;
    if (puestosVinculados > 0) {
      return {
        ok: false,
        message: `No se puede eliminar porque existen ${puestosVinculados} puesto(s) asignado(s) a este departamento.`,
      };
    }

    this._departamentos.update((list) => list.filter((d) => d.id !== id));
    return { ok: true, message: 'Departamento eliminado del catálogo.' };
  }

  crearPuesto(nombre: string, departamentoId: number, nivel: string): ActionResult<Puesto> {
    const cleanName = nombre.trim();
    if (!cleanName) return { ok: false, message: 'El nombre del puesto es obligatorio.' };
    const depto = this._departamentos().find((d) => d.id === Number(departamentoId));
    if (!depto) return { ok: false, message: 'Selecciona un departamento válido.' };

    const nextId = Math.max(0, ...this._puestos().map((p) => p.id)) + 1;
    const nuevo: Puesto = {
      id: nextId,
      nombre: cleanName,
      departamentoId: depto.id,
      departamentoNombre: depto.nombre,
      nivel: nivel.trim() || 'Operativo',
    };
    this._puestos.update((list) => [...list, nuevo]);
    return { ok: true, message: 'Puesto creado correctamente.', data: nuevo };
  }

  editarPuesto(id: number, nombre: string, departamentoId: number, nivel: string): ActionResult {
    const cleanName = nombre.trim();
    if (!cleanName) return { ok: false, message: 'El nombre del puesto es obligatorio.' };
    const depto = this._departamentos().find((d) => d.id === Number(departamentoId));
    if (!depto) return { ok: false, message: 'Selecciona un departamento válido.' };

    this._puestos.update((list) =>
      list.map((p) =>
        p.id === id
          ? { ...p, nombre: cleanName, departamentoId: depto.id, departamentoNombre: depto.nombre, nivel: nivel.trim() }
          : p,
      ),
    );
    this._empleados.update((list) =>
      list.map((e) => (e.puestoId === id ? { ...e, puestoNombre: cleanName } : e)),
    );
    return { ok: true, message: 'Puesto actualizado.' };
  }

  eliminarPuesto(id: number): ActionResult {
    const empleadosVinculados = this._empleados().filter((e) => e.puestoId === id).length;
    if (empleadosVinculados > 0) {
      return {
        ok: false,
        message: `No se puede eliminar este puesto porque tiene ${empleadosVinculados} empleado(s) vinculado(s).`,
      };
    }

    this._puestos.update((list) => list.filter((p) => p.id !== id));
    return { ok: true, message: 'Puesto eliminado del catálogo.' };
  }

  // =========================================================================
  // Registro de Asistencia Estricta (10 min tolerancia, Folios y Horas Extras)
  // =========================================================================
  obtenerFechaHoyISO(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  obtenerHoraActual(): string {
    const now = new Date();
    return now.toTimeString().slice(0, 8);
  }

  obtenerAsistenciasEmpleado(empleadoId: number): RegistroAsistencia[] {
    return this._asistencias()
      .filter((a) => a.empleadoId === empleadoId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  calcularHorasRegistro(horaEntrada: string | null, horaSalida: string | null): number {
    if (!horaEntrada || !horaSalida) return 0;
    const [h1, m1, s1] = horaEntrada.split(':').map(Number);
    const [h2, m2, s2] = horaSalida.split(':').map(Number);
    const sec1 = (h1 || 0) * 3600 + (m1 || 0) * 60 + (s1 || 0);
    const sec2 = (h2 || 0) * 3600 + (m2 || 0) * 60 + (s2 || 0);
    return sec2 > sec1 ? Math.round(((sec2 - sec1) / 3600) * 10) / 10 : 0;
  }

  obtenerAsistenciaHoy(empleadoId: number): RegistroAsistencia | undefined {
    const hoy = this.obtenerFechaHoyISO();
    return this._asistencias().find((a) => a.empleadoId === empleadoId && a.fecha === hoy);
  }

  estaFueraDeToleranciaEntrada(empleado: Empleado, horaActualHHMM?: string): boolean {
    const hora = horaActualHHMM ?? this.obtenerHoraActual().slice(0, 5);
    const actualMin = this.timeToMinutes(hora);
    const limiteMin = this.timeToMinutes(empleado.horaEntradaEstablecida) + 10;
    return actualMin > limiteMin;
  }

  esSalidaAnticipada(empleado: Empleado, horaActualHHMM?: string): boolean {
    const hora = horaActualHHMM ?? this.obtenerHoraActual().slice(0, 5);
    const actualMin = this.timeToMinutes(hora);
    const salidaMin = this.timeToMinutes(empleado.horaSalidaEstablecida);
    return actualMin < salidaMin;
  }

  registrarEntrada(
    empleadoId: number,
    folioIncidencia?: string,
    horaSimulada?: string,
  ): ActionResult<RegistroAsistencia> {
    const hoy = this.obtenerFechaHoyISO();
    const existente = this.obtenerAsistenciaHoy(empleadoId);
    if (existente) {
      return { ok: false, message: 'Ya existe un registro de entrada para el día de hoy.' };
    }

    const emp = this._empleados().find((e) => e.id === empleadoId);
    const hora = horaSimulada ?? this.obtenerHoraActual();

    let conRetardo = false;
    if (emp) {
      conRetardo = this.estaFueraDeToleranciaEntrada(emp, hora.slice(0, 5));
    }

    if (conRetardo) {
      const cleanFolio = (folioIncidencia ?? '').trim().toUpperCase();
      if (!cleanFolio) {
        return {
          ok: false,
          requiereFolio: true,
          message:
            'Has superado los 10 minutos de tolerancia. Ingresa el folio de tu solicitud de llegada tarde.',
        };
      }

      const solicitudValida = this._solicitudes().find(
        (s) =>
          s.empleadoId === empleadoId &&
          s.tipo === 'Llegada tarde' &&
          s.folio.toUpperCase() === cleanFolio &&
          s.estatus !== 'Rechazada',
      );
      if (!solicitudValida) {
        return {
          ok: false,
          requiereFolio: true,
          message:
            'El folio ingresado no corresponde a una solicitud válida de llegada tarde para tu usuario.',
        };
      }
    }

    const nextId = Math.max(0, ...this._asistencias().map((a) => a.id)) + 1;
    const nuevo: RegistroAsistencia = {
      id: nextId,
      empleadoId,
      fecha: hoy,
      horaEntrada: hora,
      horaSalida: null,
      estatusDia: 'En jornada',
      incidenciaEntrada: conRetardo
        ? `Retardo justificado (${folioIncidencia?.trim().toUpperCase()})`
        : 'Sin incidencias',
      folioEntrada: conRetardo ? folioIncidencia?.trim().toUpperCase() : undefined,
    };

    this._asistencias.update((list) => [nuevo, ...list]);
    return {
      ok: true,
      sinIncidencias: !conRetardo,
      message: conRetardo
        ? `Entrada registrada con folio ${nuevo.folioEntrada} a las ${hora}.`
        : `Entrada registrada correctamente sin incidencias (${hora}).`,
      data: nuevo,
    };
  }

  registrarSalida(
    empleadoId: number,
    folioSalidaTemprano?: string,
    horaSimulada?: string,
  ): ActionResult<RegistroAsistencia> {
    const existente = this.obtenerAsistenciaHoy(empleadoId);
    if (!existente || !existente.horaEntrada) {
      return {
        ok: false,
        message: 'Debes registrar tu hora de entrada antes de registrar la salida.',
      };
    }
    if (existente.horaSalida) {
      return { ok: false, message: 'Ya registraste tu salida el día de hoy.' };
    }

    const emp = this._empleados().find((e) => e.id === empleadoId);
    const hora = horaSimulada ?? this.obtenerHoraActual();

    let anticipada = false;
    let minutosExtra = 0;

    if (emp) {
      const actualMin = this.timeToMinutes(hora.slice(0, 5));
      const salidaMin = this.timeToMinutes(emp.horaSalidaEstablecida);
      anticipada = actualMin < salidaMin;
      if (actualMin > salidaMin) {
        minutosExtra = actualMin - salidaMin;
      }
    }

    if (anticipada) {
      const cleanFolio = (folioSalidaTemprano ?? '').trim().toUpperCase();
      if (!cleanFolio) {
        return {
          ok: false,
          requiereFolio: true,
          message:
            'Aún no es tu hora de salida establecida. Ingresa el folio de incidencia autorizado por RH.',
        };
      }

      const solicitudValida = this._solicitudes().find(
        (s) =>
          s.empleadoId === empleadoId &&
          s.tipo === 'Salida temprano' &&
          s.folio.toUpperCase() === cleanFolio &&
          s.estatus !== 'Rechazada',
      );
      if (!solicitudValida) {
        return {
          ok: false,
          requiereFolio: true,
          message:
            'El folio ingresado no corresponde a una autorización de salida temprano para tu usuario.',
        };
      }
    }

    let actualizado: RegistroAsistencia | undefined;
    this._asistencias.update((list) =>
      list.map((a) => {
        if (a.id !== existente.id) return a;
        actualizado = {
          ...a,
          horaSalida: hora,
          estatusDia: 'Completado',
          incidenciaSalida: anticipada
            ? `Salida anticipada (${folioSalidaTemprano?.trim().toUpperCase()})`
            : minutosExtra >= 60
              ? `Salida con ${Math.floor(minutosExtra / 60)}h extra(s)`
              : 'Salida normal',
          folioSalida: anticipada ? folioSalidaTemprano?.trim().toUpperCase() : undefined,
          minutosExtra,
        };
        return actualizado;
      }),
    );

    return {
      ok: true,
      message: anticipada
        ? `Salida anticipada registrada con folio ${actualizado?.folioSalida} (${hora}).`
        : `Salida registrada a las ${hora}.`,
      data: actualizado,
    };
  }

  marcarHorasExtrasSolicitadas(asistenciaId: number): void {
    this._asistencias.update((list) =>
      list.map((a) => (a.id === asistenciaId ? { ...a, horasExtrasSolicitadas: true } : a)),
    );
  }

  // =========================================================================
  // Solicitudes (Vacaciones, Permisos con/sin goce + reposición, Folios, Horas Extras)
  // =========================================================================
  crearSolicitud(empleado: Empleado, dto: CrearSolicitudDto): ActionResult<SolicitudAusencia> {
    if (!dto.fechaInicio || !dto.fechaFin || !dto.motivo.trim()) {
      return { ok: false, message: 'Todos los campos de la solicitud son obligatorios.' };
    }

    const inicio = new Date(dto.fechaInicio + 'T00:00:00');
    const fin = new Date(dto.fechaFin + 'T00:00:00');
    if (fin < inicio) {
      return { ok: false, message: 'La fecha de fin no puede ser anterior a la fecha de inicio.' };
    }

    // Validar reposición en día de descanso
    if (dto.reponerEnDescanso) {
      if (!dto.fechaReposicion) {
        return { ok: false, message: 'Debes seleccionar el día de descanso en que repondrás el permiso.' };
      }
      if (!this.esDiaDescanso(empleado, dto.fechaReposicion)) {
        return {
          ok: false,
          message:
            'El día seleccionado para reponer es un día laboral en tu horario. Solo puedes seleccionar un día de descanso.',
        };
      }
    }

    const diffMs = fin.getTime() - inicio.getTime();
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const nextId = Math.max(0, ...this._solicitudes().map((s) => s.id)) + 1;
    const folio = `FOL-2026-${String(nextId).padStart(3, '0')}`;

    const nueva: SolicitudAusencia = {
      id: nextId,
      folio,
      empleadoId: empleado.id,
      empleadoNombre: `${empleado.nombre} ${empleado.apellidoPaterno} ${empleado.apellidoMaterno}`,
      numeroEmpleado: empleado.numeroEmpleado,
      departamentoNombre: empleado.departamentoNombre ?? 'Sin departamento',
      tipo: dto.tipo,
      fechaInicio: dto.fechaInicio,
      fechaFin: dto.fechaFin,
      diasSolicitados: dias,
      reponerEnDescanso: !!dto.reponerEnDescanso,
      fechaReposicion: dto.reponerEnDescanso ? dto.fechaReposicion : undefined,
      horasExtrasSolicitadas: dto.horasExtrasSolicitadas,
      motivo: dto.motivo.trim(),
      estatus: 'Pendiente',
      fechaSolicitud: this.obtenerFechaHoyISO(),
    };

    this._solicitudes.update((list) => [nueva, ...list]);
    return {
      ok: true,
      message: `Solicitud enviada con folio ${folio} para revisión de RH.`,
      data: nueva,
    };
  }

  resolverSolicitud(
    id: number,
    estatus: Extract<EstatusSolicitud, 'Aprobada' | 'Rechazada'>,
    comentarioAdmin?: string,
  ): ActionResult {
    this._solicitudes.update((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              estatus,
              comentarioAdmin: comentarioAdmin?.trim() || undefined,
            }
          : s,
      ),
    );
    return {
      ok: true,
      message:
        estatus === 'Aprobada'
          ? 'Solicitud aprobada correctamente.'
          : 'Solicitud rechazada.',
    };
  }

  // =========================================================================
  // Retenciones (Leyes Mexicanas) & Corte de Nómina Quincenal
  // =========================================================================
  actualizarRetenciones(cfg: ConfiguracionRetenciones): ActionResult {
    if (
      cfg.isrPorcentaje < 0 ||
      cfg.imssPorcentaje < 0 ||
      cfg.infonavitPorcentaje < 0 ||
      cfg.ivaPorcentaje < 0
    ) {
      return { ok: false, message: 'Los porcentajes de retención no pueden ser negativos.' };
    }
    this._retenciones.set({ ...cfg });
    return { ok: true, message: 'Configuración de retenciones actualizada.' };
  }

  generarCorteQuincenal(
    fechaInicio: string,
    fechaFin: string,
    periodoLabel: string,
  ): ActionResult<ReciboNomina[]> {
    const corteId = `CORTE-${fechaInicio}-${fechaFin}`;
    const ret = this._retenciones();
    const asistencias = this._asistencias();
    const solicitudes = this._solicitudes();

    // Reemplazar corte borrador si ya existía sin aprobar
    const yaAprobado = this._recibos().some(
      (r) => r.corteId === corteId && r.aprobadoPorRh,
    );
    if (yaAprobado) {
      return {
        ok: false,
        message: 'Este periodo de corte ya fue aprobado y liberado por RH.',
      };
    }

    let nextId = Math.max(0, ...this._recibos().map((r) => r.id)) + 1;
    const nuevos: ReciboNomina[] = this.empleados()
      .filter((e) => e.estatus === 'Activo')
      .map((emp) => {
        const asistEmp = asistencias.filter(
          (a) => a.empleadoId === emp.id && a.fecha >= fechaInicio && a.fecha <= fechaFin,
        );
        const diasTrabajados = asistEmp.length;
        const horasTrabajadas =
          Math.round(
            asistEmp.reduce(
              (sum, a) => sum + this.calcularHorasRegistro(a.horaEntrada, a.horaSalida),
              0,
            ) * 10,
          ) / 10;

        const solAprobadas = solicitudes.filter(
          (s) =>
            s.empleadoId === emp.id &&
            s.estatus === 'Aprobada' &&
            s.fechaFin >= fechaInicio &&
            s.fechaInicio <= fechaFin,
        );

        const diasJustificados = solAprobadas
          .filter((s) => s.tipo !== 'Permiso sin goce' && s.tipo !== 'Horas extras')
          .reduce((sum, s) => sum + s.diasSolicitados, 0);

        const horasExtrasPagadas = solAprobadas
          .filter((s) => s.tipo === 'Horas extras')
          .reduce((sum, s) => sum + (s.horasExtrasSolicitadas || 1), 0);

        const sueldoBrutoQuincenal = Math.round((emp.salarioBase / 2) * 100) / 100;
        const tarifaHora = emp.salarioBase / 30 / Math.max(1, emp.horasPorDia);
        const pagoHorasExtras = Math.round(horasExtrasPagadas * tarifaHora * 2 * 100) / 100;
        const baseGravable = sueldoBrutoQuincenal + pagoHorasExtras;

        const descuentoIsr = Math.round(baseGravable * (ret.isrPorcentaje / 100) * 100) / 100;
        const descuentoImss = Math.round(baseGravable * (ret.imssPorcentaje / 100) * 100) / 100;
        const descuentoIva = Math.round(baseGravable * (ret.ivaPorcentaje / 100) * 100) / 100;
        const descuentoInfonavit = emp.tieneCreditoInfonavit
          ? emp.descuentoInfonavitQuincenal > 0
            ? emp.descuentoInfonavitQuincenal
            : Math.round(baseGravable * (ret.infonavitPorcentaje / 100) * 100) / 100
          : 0;
        const descuentoPrestamoEmpresa = emp.tienePrestamoEmpresa
          ? emp.montoPrestamoQuincenal
          : 0;

        const totalRetenciones =
          Math.round(
            (descuentoIsr +
              descuentoImss +
              descuentoIva +
              descuentoInfonavit +
              descuentoPrestamoEmpresa) *
              100,
          ) / 100;
        const sueldoNeto = Math.max(
          0,
          Math.round((baseGravable - totalRetenciones) * 100) / 100,
        );

        return {
          id: nextId++,
          corteId,
          periodoLabel,
          fechaInicio,
          fechaFin,
          empleadoId: emp.id,
          numeroEmpleado: emp.numeroEmpleado,
          empleadoNombre: `${emp.nombre} ${emp.apellidoPaterno} ${emp.apellidoMaterno}`,
          departamento: emp.departamentoNombre ?? '',
          puesto: emp.puestoNombre ?? '',
          diasTrabajados,
          diasJustificados,
          horasTrabajadas,
          horasExtrasPagadas,
          pagoHorasExtras,
          sueldoBrutoQuincenal,
          descuentoIsr,
          descuentoImss,
          descuentoInfonavit,
          descuentoIva,
          descuentoPrestamoEmpresa,
          totalRetenciones,
          sueldoNeto,
          aprobadoPorRh: false,
        };
      });

    this._recibos.update((list) => [
      ...list.filter((r) => r.corteId !== corteId),
      ...nuevos,
    ]);

    return {
      ok: true,
      message: `Borrador de corte generado para ${nuevos.length} empleados. Revísalo y apruébalo para liberar recibos.`,
      data: nuevos,
    };
  }

  actualizarReciboCorte(
    reciboId: number,
    cambios: Partial<
      Pick<
        ReciboNomina,
        | 'sueldoBrutoQuincenal'
        | 'pagoHorasExtras'
        | 'descuentoIsr'
        | 'descuentoImss'
        | 'descuentoInfonavit'
        | 'descuentoIva'
        | 'descuentoPrestamoEmpresa'
        | 'notasRh'
      >
    >,
  ): ActionResult {
    this._recibos.update((list) =>
      list.map((r) => {
        if (r.id !== reciboId) return r;
        const merged = { ...r, ...cambios };
        const totalRetenciones =
          Math.round(
            (Number(merged.descuentoIsr) +
              Number(merged.descuentoImss) +
              Number(merged.descuentoInfonavit) +
              Number(merged.descuentoIva) +
              Number(merged.descuentoPrestamoEmpresa)) *
              100,
          ) / 100;
        const sueldoNeto = Math.max(
          0,
          Math.round(
            (Number(merged.sueldoBrutoQuincenal) +
              Number(merged.pagoHorasExtras) -
              totalRetenciones) *
              100,
          ) / 100,
        );
        return { ...merged, totalRetenciones, sueldoNeto };
      }),
    );
    return { ok: true, message: 'Detalle del recibo actualizado en el corte.' };
  }

  aprobarCorteQuincenal(corteId: string): ActionResult {
    const hoy = this.obtenerFechaHoyISO();
    this._recibos.update((list) =>
      list.map((r) =>
        r.corteId === corteId
          ? { ...r, aprobadoPorRh: true, fechaAprobacion: hoy }
          : r,
      ),
    );
    return {
      ok: true,
      message:
        'Corte de nómina aprobado. Los empleados ya pueden descargar sus recibos de este periodo.',
    };
  }
}
