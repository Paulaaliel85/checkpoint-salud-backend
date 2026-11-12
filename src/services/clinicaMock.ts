import type { AptoPorVencer } from '../types/clinica';
// Función auxiliar para calcular fechas relativas exactas a partir de hoy
const calcularFechaVencimiento = (diasOffset: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasOffset);
  return fecha.toISOString().split('T')[0];
};

export const aptosPorVencerMock: AptoPorVencer[] = [
  // --- VENCIMIENTO MENOR A 7 DÍAS (Prioridad alta del profe) ---
  {
    id: 'apt-001',
    paciente: {
      id: 'pac-01',
      nombre: 'Carlos',
      apellido: 'Gómez',
      dni: '35489123',
      puesto: 'Operador de Yacimiento',
    },
    empresa: {
      id: 'emp-01',
      razonSocial: 'PetroSur S.A.',
      cuit: '30-71122334-9',
    },
    fechaEmision: calcularFechaVencimiento(-358),
    fechaVencimiento: calcularFechaVencimiento(3), // 3 días restantes
    diasRestantes: 3,
    estadoAptitud: 'APTO',
  },
  {
    id: 'apt-002',
    paciente: {
      id: 'pac-02',
      nombre: 'Mariana',
      apellido: 'Pérez',
      dni: '38901234',
      puesto: 'Técnica de Seguridad',
    },
    empresa: {
      id: 'emp-02',
      razonSocial: 'Comahue Drilling SRL',
      cuit: '30-68899441-2',
    },
    fechaEmision: calcularFechaVencimiento(-362),
    fechaVencimiento: calcularFechaVencimiento(5), // 5 días restantes
    diasRestantes: 5,
    estadoAptitud: 'APTO_CON_OBSERVACIONES',
  },

  // --- VENCIMIENTO ENTRE 7 Y 30 DÍAS ---
  {
    id: 'apt-003',
    paciente: {
      id: 'pac-03',
      nombre: 'Esteban',
      apellido: 'Ruarte',
      dni: '32112456',
      puesto: 'Chofer de Cisterna',
    },
    empresa: {
      id: 'emp-01',
      razonSocial: 'PetroSur S.A.',
      cuit: '30-71122334-9',
    },
    fechaEmision: calcularFechaVencimiento(-345),
    fechaVencimiento: calcularFechaVencimiento(15), // 15 días restantes
    diasRestantes: 15,
    estadoAptitud: 'APTO',
  },
  {
    id: 'apt-004',
    paciente: {
      id: 'pac-04',
      nombre: 'Lucía',
      apellido: 'Fernández',
      dni: '40123789',
      puesto: 'Administrativa de Base',
    },
    empresa: {
      id: 'emp-03',
      razonSocial: 'Patagonia Servicios Petroleros',
      cuit: '30-59988776-4',
    },
    fechaEmision: calcularFechaVencimiento(-340),
    fechaVencimiento: calcularFechaVencimiento(28), // 28 días restantes
    diasRestantes: 28,
    estadoAptitud: 'APTO',
  },

  // --- VENCIMIENTO MAYOR A 30 DÍAS ---
  {
    id: 'apt-005',
    paciente: {
      id: 'pac-05',
      nombre: 'Matías',
      apellido: 'Navarro',
      dni: '36789456',
      puesto: 'Electricista Industrial',
    },
    empresa: {
      id: 'emp-02',
      razonSocial: 'Comahue Drilling SRL',
      cuit: '30-68899441-2',
    },
    fechaEmision: calcularFechaVencimiento(-180),
    fechaVencimiento: calcularFechaVencimiento(45), // 45 días restantes
    diasRestantes: 45,
    estadoAptitud: 'APTO',
  },
  {
    id: 'apt-006',
    paciente: {
      id: 'pac-06',
      nombre: 'Romina',
      apellido: 'Soria',
      dni: '34567890',
      puesto: 'Ingeniera de Producción',
    },
    empresa: {
      id: 'emp-01',
      razonSocial: 'PetroSur S.A.',
      cuit: '30-71122334-9',
    },
    fechaEmision: calcularFechaVencimiento(-90),
    fechaVencimiento: calcularFechaVencimiento(90), // 90 días restantes
    diasRestantes: 90,
    estadoAptitud: 'APTO',
  },
];

// Objeto agrupador que espera el componente en su importación
export const clinicaMock = {
  getAptosPorVencer: async (): Promise<AptoPorVencer[]> => {
    return Promise.resolve(aptosPorVencerMock);
  },
};