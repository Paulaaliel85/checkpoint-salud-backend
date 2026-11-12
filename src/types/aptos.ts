export interface AptoMedico {
  id: string
  estadoAptitud: 'APTO' | 'APTO_CON_OBSERVACIONES'
  fechaEmision: string | null
  fechaVencimiento: string
  paciente: {
    id: string
    nombre: string
    apellido: string
    empresa: {
      razonSocial: string
    }
    puesto: {
      nombrePuesto: string
    }
  }
}

export interface RespuestaAptos {
  mensaje: string
  aptos: AptoMedico[]
}