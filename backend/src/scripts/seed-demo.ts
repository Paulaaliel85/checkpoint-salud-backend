import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

// UUID fijos: permiten volver a correr el script sin duplicar turnos ni aptos.
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// Fecha sin hora (columnas DATE), desplazada N días de hoy.
function dia(dias: number): Date {
  const hoy = new Date();
  return new Date(
    Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + dias),
  );
}

// Fecha y hora desplazada N días de hoy.
function turnoEn(dias: number, hora: number): Date {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, 0, 0, 0);
  return fecha;
}

function restarMeses(fecha: Date, meses: number): Date {
  const resultado = new Date(fecha);
  resultado.setUTCMonth(resultado.getUTCMonth() - meses);
  return resultado;
}

const empresas = [
  { razonSocial: "Petrolera Andina S.A.", cuit: "30-00000001-1" },
  { razonSocial: "Servicios Patagonia S.R.L.", cuit: "30-00000002-2" },
  { razonSocial: "Transportes del Sur S.A.", cuit: "30-00000003-3" },
  { razonSocial: "Perforaciones Norte S.A.", cuit: "30-00000004-4" },
  { razonSocial: "Yacimientos Cuenca S.A.", cuit: "30-00000005-5" },
  { razonSocial: "Logística Petrolera S.R.L.", cuit: "30-00000006-6" },
];

const puestos = [
  { nombrePuesto: "Operario de campo", mesesVigencia: 12 },
  { nombrePuesto: "Chofer", mesesVigencia: 6 },
  { nombrePuesto: "Soldador", mesesVigencia: 12 },
  { nombrePuesto: "Administrativa", mesesVigencia: 12 },
  { nombrePuesto: "Auxiliar", mesesVigencia: 6 },
];

const sedes = [
  { id: uuid(1), nombre: "Neuquén Capital", direccion: "Sede central" },
  { id: uuid(2), nombre: "Rincón de los Sauces", direccion: "Sucursal" },
];

type Resultado = "APTO" | "APTO_CON_OBSERVACIONES" | "NO_APTO";

interface Muestra {
  dni: string;
  nombre: string;
  apellido: string;
  empresa: number;
  puesto: string;
  apto?: { estado: Resultado; vence?: number; observaciones?: string };
  turno?: {
    dias: number;
    hora: number;
    estado: "PENDIENTE" | "ASISTIO" | "CANCELADO";
    sede: number;
  };
}

const muestras: Muestra[] = [
  { dni: "30111222", nombre: "Lucía", apellido: "Gómez", empresa: 0, puesto: "Operario de campo", apto: { estado: "APTO", vence: 120 }, turno: { dias: -30, hora: 9, estado: "ASISTIO", sede: 0 } },
  { dni: "32333444", nombre: "Camila", apellido: "Sosa", empresa: 0, puesto: "Administrativa", apto: { estado: "APTO", vence: 28 }, turno: { dias: 3, hora: 10, estado: "PENDIENTE", sede: 0 } },
  { dni: "38000111", nombre: "Lucas", apellido: "Navarro", empresa: 0, puesto: "Soldador", apto: { estado: "APTO", vence: 6 } },
  { dni: "38111222", nombre: "Ana", apellido: "Quiroga", empresa: 0, puesto: "Auxiliar" },
  { dni: "31222333", nombre: "Mateo", apellido: "Ríos", empresa: 1, puesto: "Chofer", apto: { estado: "APTO", vence: 5 }, turno: { dias: -2, hora: 11, estado: "ASISTIO", sede: 0 } },
  { dni: "35666777", nombre: "Tomás", apellido: "Vera", empresa: 1, puesto: "Operario de campo", apto: { estado: "APTO", vence: 200 } },
  { dni: "33444555", nombre: "Joaquín", apellido: "Paz", empresa: 2, puesto: "Soldador", apto: { estado: "NO_APTO" }, turno: { dias: -1, hora: 10, estado: "CANCELADO", sede: 1 } },
  { dni: "36777888", nombre: "Julieta", apellido: "Díaz", empresa: 2, puesto: "Chofer", turno: { dias: 2, hora: 9, estado: "PENDIENTE", sede: 0 } },
  { dni: "34555666", nombre: "Valentina", apellido: "Luna", empresa: 3, puesto: "Auxiliar", turno: { dias: 1, hora: 9, estado: "PENDIENTE", sede: 1 } },
  { dni: "37888999", nombre: "Bruno", apellido: "Acosta", empresa: 3, puesto: "Soldador", apto: { estado: "NO_APTO" } },
  { dni: "30999888", nombre: "Martín", apellido: "Pérez", empresa: 3, puesto: "Operario de campo", apto: { estado: "APTO_CON_OBSERVACIONES", vence: 45, observaciones: "Control anual de la vista." } },
  { dni: "39000111", nombre: "Elena", apellido: "Castro", empresa: 4, puesto: "Administrativa", apto: { estado: "APTO", vence: 15 } },
  { dni: "39111222", nombre: "Hugo", apellido: "Molina", empresa: 4, puesto: "Chofer", apto: { estado: "APTO", vence: 3 }, turno: { dias: 0, hora: 15, estado: "PENDIENTE", sede: 1 } },
  { dni: "39222333", nombre: "Sofía", apellido: "Herrera", empresa: 5, puesto: "Auxiliar", apto: { estado: "APTO", vence: 90 } },
  { dni: "39333444", nombre: "Diego", apellido: "Benítez", empresa: 5, puesto: "Operario de campo", apto: { estado: "APTO", vence: -4 } },
];

async function crearUsuario(
  email: string,
  password: string,
  rol: "ADMIN" | "CLINICA" | "EMPRESA" | "PACIENTE",
  vinculo: { empresaId?: string; pacienteId?: string } = {},
) {
  await prisma.usuario.upsert({
    where: { email },
    update: vinculo,
    create: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      rol,
      ...vinculo,
    },
  });
}

async function main() {
  const empresaIds: string[] = [];
  const puestoIds = new Map<string, string>();

  for (const [i, datos] of empresas.entries()) {
    const empresa = await prisma.empresa.upsert({
      where: { cuit: datos.cuit },
      update: {},
      create: datos,
    });
    empresaIds.push(empresa.id);

    for (const p of puestos) {
      const puesto = await prisma.puestoRequisito.upsert({
        where: {
          nombrePuesto_empresaId: {
            nombrePuesto: p.nombrePuesto,
            empresaId: empresa.id,
          },
        },
        update: {},
        create: { ...p, empresaId: empresa.id },
      });
      puestoIds.set(`${i}:${p.nombrePuesto}`, puesto.id);
    }
  }

  for (const sede of sedes) {
    await prisma.sede.upsert({
      where: { id: sede.id },
      update: {},
      create: sede,
    });
  }

  const pacienteIds: string[] = [];
  let n = 0;

  for (const m of muestras) {
    n += 1;
    const paciente = await prisma.paciente.upsert({
      where: { dni: m.dni },
      update: {},
      create: {
        dni: m.dni,
        nombre: m.nombre,
        apellido: m.apellido,
        empresaId: empresaIds[m.empresa]!,
        puestoId: puestoIds.get(`${m.empresa}:${m.puesto}`)!,
      },
    });
    pacienteIds.push(paciente.id);

    if (m.apto) {
      const vigencia = puestos.find((p) => p.nombrePuesto === m.puesto)!.mesesVigencia;
      const vence = m.apto.vence;
      const datos = {
        pacienteId: paciente.id,
        estadoAptitud: m.apto.estado,
        fechaEmision: vence === undefined ? dia(-10) : restarMeses(dia(vence), vigencia),
        fechaVencimiento: vence === undefined ? null : dia(vence),
        detalleClinico: m.apto.observaciones ?? null,
      };

      await prisma.aptoMedico.upsert({
        where: { id: uuid(1000 + n) },
        update: datos,
        create: { id: uuid(1000 + n), ...datos },
      });
    }

    if (m.turno) {
      const datos = {
        pacienteId: paciente.id,
        sedeId: sedes[m.turno.sede]!.id,
        fechaHora: turnoEn(m.turno.dias, m.turno.hora),
        estado: m.turno.estado,
      };

      await prisma.turno.upsert({
        where: { id: uuid(2000 + n) },
        update: datos,
        create: { id: uuid(2000 + n), ...datos },
      });
    }
  }

  await crearUsuario("administrador@gmail.com", "checkpoint2026#", "ADMIN");
  await crearUsuario("clinica@checkpoint.test", "ClinicaDemo2026!", "CLINICA");
  await crearUsuario("empresa@checkpoint.test", "EmpresaDemo2026!", "EMPRESA", {
    empresaId: empresaIds[0]!,
  });
  await crearUsuario("paciente@checkpoint.test", "PacienteDemo2026!", "PACIENTE", {
    pacienteId: pacienteIds[1]!,
  });

  console.log(
    `Datos de ejemplo cargados: ${empresas.length} empresas, ${muestras.length} pacientes y 4 usuarios.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("No se pudieron cargar los datos de ejemplo:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });