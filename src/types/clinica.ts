export type EstadoAptitud = 'APTO' | 'APTO_CON_OBSERVACIONES' | 'NO_APTO' | 'PENDIENTE';

export interface PacienteApto {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  puesto: string;
}

export interface EmpresaApto {
  id: string;
  razonSocial: string;
  cuit: string;
}

export interface AptoPorVencer {
  id: string;
  paciente: PacienteApto;
  empresa: EmpresaApto;
  fechaEmision: string;
  fechaVencimiento: string;
  diasRestantes: number;
  estadoAptitud: EstadoAptitud;
}