
export type RolUsuario = 'PACIENTE' | 'CLINICA' | 'EMPRESA' | 'ADMIN'
// Interfaces para los datos de empresas y puestos
export  interface  Puesto {
  id: string
  nombrePuesto: string
}

export  interface Empresa {
  id: string
  razonSocial: string
  cuit: string
  puestos: Puesto[]
}
