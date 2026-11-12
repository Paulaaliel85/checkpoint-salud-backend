export interface PacienteApi {
  nombre: string
  apellido: string
  dni: string
  empresa?: { razonSocial: string }
  puesto?: { nombrePuesto: string }
}

export interface SedeApi {
  nombre: string
  direccion?: string
}

export interface SolicitudApi {
  id: string
  fechaPreferida: string
  estado: string
  paciente: PacienteApi
  sede: SedeApi
}

export interface SolicitudesResponse {
  mensaje: string
  solicitudes: SolicitudApi[]
}

export interface TurnoApi {
  id: string
  fechaHora: string
  estado: string
  paciente?: {
    nombre: string
    apellido: string
    dni: string
    empresa?: { razonSocial: string }
  }
  sede?: { nombre: string }
}
