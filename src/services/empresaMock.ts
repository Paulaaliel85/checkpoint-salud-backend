import type { DatosEmpresa, TrabajadorEmpresa, TurnoEmpresa } from '../types/empresa'
import { enDias } from '../utils/fechas'

const dia = (n: number) => enDias(n).slice(0, 10)
// Datos de ejemplo Mock para la empresa, incluyendo trabajadores y turnos.
export const datosEmpresaMock: DatosEmpresa = {
  razonSocial: 'Empresa de Ejemplo S.A.',
  cuit: '30-12345678-9',
}

export const trabajadoresMock: TrabajadorEmpresa[] = [
  { id: 'w1', dni: '30111222', apellido: 'Gómez', nombre: 'Lucía', puesto: 'Operario de campo', estadoAptitud: 'APTO', fechaVencimiento: dia(120) },
  { id: 'w2', dni: '31222333', apellido: 'Ríos', nombre: 'Mateo', puesto: 'Chofer', estadoAptitud: 'APTO', fechaVencimiento: dia(5) },
  { id: 'w3', dni: '32333444', apellido: 'Sosa', nombre: 'Camila', puesto: 'Administrativa', estadoAptitud: 'APTO', fechaVencimiento: dia(28) },
  { id: 'w4', dni: '33444555', apellido: 'Paz', nombre: 'Joaquín', puesto: 'Soldador', estadoAptitud: 'NO_APTO', fechaVencimiento: null },
  { id: 'w5', dni: '34555666', apellido: 'Luna', nombre: 'Valentina', puesto: 'Auxiliar', estadoAptitud: 'PENDIENTE', fechaVencimiento: null },
  { id: 'w6', dni: '35666777', apellido: 'Vera', nombre: 'Tomás', puesto: 'Operario de campo', estadoAptitud: 'APTO', fechaVencimiento: dia(200) },
  { id: 'w7', dni: '36777888', apellido: 'Díaz', nombre: 'Julieta', puesto: 'Chofer', estadoAptitud: 'PENDIENTE', fechaVencimiento: null },
  { id: 'w8', dni: '37888999', apellido: 'Acosta', nombre: 'Bruno', puesto: 'Soldador', estadoAptitud: 'NO_APTO', fechaVencimiento: null },
]

export const turnosEmpresaMock: TurnoEmpresa[] = [
  { id: 'q1', trabajadorId: 'w1', fechaHora: enDias(-2, '09:00'), trabajador: 'Gómez, Lucía', sede: 'Neuquén Capital', estado: 'ASISTIO' },
  { id: 'q2', trabajadorId: 'w4', fechaHora: enDias(-1, '11:15'), trabajador: 'Paz, Joaquín', sede: 'Neuquén Capital', estado: 'CANCELADO' },
  { id: 'q3', trabajadorId: 'w5', fechaHora: enDias(1, '10:30'), trabajador: 'Luna, Valentina', sede: 'Neuquén Capital', estado: 'PENDIENTE' },
  { id: 'q4', trabajadorId: 'w7', fechaHora: enDias(2, '08:45'), trabajador: 'Díaz, Julieta', sede: 'Rincón de los Sauces', estado: 'PENDIENTE' },
]