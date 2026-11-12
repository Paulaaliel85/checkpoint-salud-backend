export interface Turno {
  id: string
  fechaHora: string
  estado: string
  sede: {
    nombre: string
    direccion: string
  }
}

export interface RespuestaTurnos {
  mensaje: string
  turnos: Turno[]
}

export interface Apto {
  id: string
  estadoAptitud: 'APTO' | 'APTO_CON_OBSERVACIONES' | 'NO_APTO'
  fechaEmision: string
  fechaVencimiento: string | null
}

export interface RespuestaApto {
  mensaje: string
  apto: Apto
}
