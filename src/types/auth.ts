export type Rol = 'CLINICA' | 'EMPRESA' | 'ADMIN'|'PACIENTE'; //defino los roles posibles
export interface Usuario {
  id: string
  email: string
  rol: Rol
}