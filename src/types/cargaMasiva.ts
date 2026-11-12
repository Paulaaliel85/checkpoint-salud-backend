export interface ArchivoHistorial {
  nombre: string
  fecha: string
  registros: number
  estado: 'Éxito' | 'Con advertencias'
  contenidoRaw: string
}

export interface RespuestaCarga {
  mensaje: string
  totalErrores: number
  detallesErrores?: string[]
}
