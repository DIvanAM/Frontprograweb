export type RolUsuario = 'ADMIN' | 'EMPLEADO';
export type EstatusEmpleado = 'Activo' | 'Inactivo';
export type EstatusSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';
export type DiaSemana = 'L' | 'M' | 'Mi' | 'J' | 'V' | 'S' | 'D';

export type TipoAusencia =
  | 'Vacaciones'
  | 'Permiso con goce'
  | 'Permiso sin goce'
  | 'Incapacidad'
  | 'Llegada tarde'
  | 'Salida temprano'
  | 'Horas extras';

export interface Departamento {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Puesto {
  id: number;
  nombre: string;
  departamentoId: number;
  departamentoNombre?: string;
  nivel?: string;
}

export interface Empleado {
  id: number;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correoInstitucional: string;
  telefono: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  departamentoId: number;
  departamentoNombre?: string;
  puestoId: number;
  puestoNombre?: string;
  salarioBase: number;
  // Horario estricto
  horaEntradaEstablecida: string; // HH:mm (ej. "09:00")
  horaSalidaEstablecida: string; // HH:mm (ej. "18:00")
  horasPorDia: number; // Calculado lógicamente del horario estricto
  diasLaborales: DiaSemana[]; // Días seleccionados como laborables; los restantes son descanso
  diasPorSemana: number; // Calculado de diasLaborales.length
  // Créditos y préstamos por empleado (configurables por RH)
  tienePrestamoEmpresa: boolean;
  montoPrestamoQuincenal: number;
  tieneCreditoInfonavit: boolean;
  descuentoInfonavitQuincenal: number;
  rol: RolUsuario;
  estatus: EstatusEmpleado;
  primerInicioSesion: boolean;
}

export interface CrearEmpleadoDto {
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correoInstitucional: string;
  telefono: string;
  fechaNacimiento?: string;
  fechaIngreso: string;
  departamentoId: number;
  puestoId: number;
  salarioBase: number;
  horaEntradaEstablecida: string;
  horaSalidaEstablecida: string;
  diasLaborales: DiaSemana[];
  tienePrestamoEmpresa?: boolean;
  montoPrestamoQuincenal?: number;
  tieneCreditoInfonavit?: boolean;
  descuentoInfonavitQuincenal?: number;
  rol: RolUsuario;
}

export interface LoginRequest {
  correoInstitucional: string;
  password: string;
}

export interface AuthSession {
  token: string;
  empleado: Empleado;
}

export interface RegistroAsistencia {
  id: number;
  empleadoId: number;
  fecha: string; // YYYY-MM-DD
  horaEntrada: string | null; // HH:mm:ss
  horaSalida: string | null; // HH:mm:ss
  estatusDia: 'En jornada' | 'Completado';
  incidenciaEntrada?: string; // Ej. "Sin incidencias" | "Retardo con folio FOL-..."
  folioEntrada?: string;
  incidenciaSalida?: string; // Ej. "Salida normal" | "Salida anticipada con folio FOL-..."
  folioSalida?: string;
  minutosExtra?: number;
  horasExtrasSolicitadas?: boolean;
}

export interface SolicitudAusencia {
  id: number;
  folio: string; // Ej. "FOL-2026-001"
  empleadoId: number;
  empleadoNombre: string;
  numeroEmpleado: string;
  departamentoNombre: string;
  tipo: TipoAusencia;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string; // YYYY-MM-DD
  diasSolicitados: number;
  reponerEnDescanso?: boolean;
  fechaReposicion?: string;
  horasExtrasSolicitadas?: number;
  motivo: string;
  estatus: EstatusSolicitud;
  fechaSolicitud: string;
  comentarioAdmin?: string;
}

export interface CrearSolicitudDto {
  tipo: TipoAusencia;
  fechaInicio: string;
  fechaFin: string;
  reponerEnDescanso?: boolean;
  fechaReposicion?: string;
  horasExtrasSolicitadas?: number;
  motivo: string;
}

export interface ConfiguracionRetenciones {
  isrPorcentaje: number;
  imssPorcentaje: number;
  infonavitPorcentaje: number;
  ivaPorcentaje: number;
}

export interface ReciboNomina {
  id: number;
  corteId: string;
  periodoLabel: string; // Ej. "1ra Quincena Noviembre 2026 (01 al 15)"
  fechaInicio: string;
  fechaFin: string;
  empleadoId: number;
  numeroEmpleado: string;
  empleadoNombre: string;
  departamento: string;
  puesto: string;
  diasTrabajados: number;
  diasJustificados: number;
  horasTrabajadas: number;
  horasExtrasPagadas: number;
  pagoHorasExtras: number;
  sueldoBrutoQuincenal: number;
  descuentoIsr: number;
  descuentoImss: number;
  descuentoInfonavit: number;
  descuentoIva: number;
  descuentoPrestamoEmpresa: number;
  totalRetenciones: number;
  sueldoNeto: number;
  aprobadoPorRh: boolean;
  fechaAprobacion?: string;
  notasRh?: string;
}
