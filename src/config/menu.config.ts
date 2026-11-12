import type { Rol } from '../types/auth'
// Interfaz que representa un elemento del menú, con su etiqueta, ruta y icono.
export interface MenuItem {
  label: string
  route: string
  icon: string
}
// Elementos del menú para cada rol de usuario. 
// Cada rol tiene un array de objetos MenuItem que representan las opciones del menú disponibles para ese rol.
export const menuPorRol: Record<Rol, MenuItem[]> = {
  CLINICA: [
    { label: 'Inicio', route: '/clinica', icon: 'home' },
    { label: 'Empresas', route: '/clinica/empresas', icon: 'building' },
    { label: 'Turnos', route: '/clinica/turnos', icon: 'calendar' },
    { label: 'Aptos y vencimientos', route: '/clinica/aptos', icon: 'check' },
    { label: 'Carga masiva', route: '/clinica/carga-masiva', icon: 'upload' },
  ],
  EMPRESA: [
    { label: 'Inicio', route: '/empresa', icon: 'home' },
    { label: 'Trabajadores', route: '/empresa/trabajadores', icon: 'users' },
    { label: 'Turnos', route: '/empresa/turnos', icon: 'calendar' },
    { label: 'Aptos y vencimientos', route: '/empresa/aptos', icon: 'check' },
    { label: 'Carga masiva', route: '/empresa/carga-masiva', icon: 'upload' },
  ],
  ADMIN: [
    { label: 'Inicio', route: '/admin', icon: 'home' },
  ],
  PACIENTE: [],
}