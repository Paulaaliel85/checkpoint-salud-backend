export type EstadoAptitud =
  | 'APTO'
  | 'NO_APTO'
  | 'PENDIENTE'
  | 'APTO_CON_OBSERVACIONES'

export type EstadoTurnoEmpresa = 'PENDIENTE' | 'ASISTIO' | 'CANCELADO'

// Lo único que la empresa puede ver de cada trabajador.
// No incluye el resultado clínico ni el documento de aptitud 
export interface TrabajadorEmpresa {
  id: string
  dni: string
  apellido: string
  nombre: string
  estadoAptitud: EstadoAptitud
  fechaVencimiento: string | null // AAAA-MM-DD; null si todavía no hay apto vigente
  puesto: {
    id: string
    nombrePuesto: string
    mesesVigencia: number
  } | null

}


export interface TurnoEmpresa {
   id: string
  trabajadorId: string
  trabajador: string
  fechaHora: string
  horaAConfirmar: boolean
  sedeId: string
  sede: string
  direccionSede?: string | null
  estado: EstadoTurnoEmpresa
  estadoSolicitud?: string
}


  export interface Empresa {
  id: string
  razonSocial: string
  cuit: string
}

export interface RespuestaEmpresa {
  mensaje: string
  empresa: Empresa
  trabajadores: TrabajadorEmpresa[]
}


export interface Sede {
  id: string
  nombre: string
  direccion: string
}




export interface RespuestaTrabajadores {
  mensaje: string
  trabajadores: TrabajadorEmpresa[]
}

export interface RespuestaSedes {
  mensaje: string
  sedes: Sede[]
}

export interface RespuestaTurnos {
  mensaje: string
  turnos: TurnoEmpresa[]
}
export interface PorSolicitar {
  trabajador: TrabajadorEmpresa
  texto: string
  urgente: boolean
  orden: number
}