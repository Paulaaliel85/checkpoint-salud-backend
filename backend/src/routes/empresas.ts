
import express from "express";
import bcrypt from "bcrypt";
import { autenticar, permitirRoles } from "../middlewares/auth.js";
import { prisma } from "../lib/prisma.js";

export const empresasRouter = express.Router();

// EMPRESA: obtener trabajadores asociados a la empresa del usuario.
empresasRouter.get(
  "/empresa/trabajadores",
  autenticar,
  permitirRoles("EMPRESA"),
  async (req, res) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: req.usuario!.id },
        select: { empresaId: true },
      });

      if (!usuario?.empresaId) {
        return res.status(404).json({
          mensaje: "No se encontró una empresa asociada a este usuario.",
        });
      }

      const empresa = await prisma.empresa.findUnique({
        where: { id: usuario.empresaId },
        select: {
          id: true,
          razonSocial: true,
          cuit: true,
          pacientes: {
            orderBy: { apellido: "asc" },
            select: {
              id: true,
              dni: true,
              nombre: true,
              apellido: true,
              puesto: {
                select: {
                  id: true,
                  nombrePuesto: true,
                  mesesVigencia: true,
                },
              },
              aptos: {
                orderBy: [
                  { fechaEmision: "desc" },
                  { id: "desc" },
                ],
                take: 1,
                select: {
                  estadoAptitud: true,
                  fechaVencimiento: true,
                },
              },
            },
          },
        },
      });

      if (!empresa) {
        return res.status(404).json({
          mensaje: "No se encontró la empresa.",
        });
      }

      const trabajadores = empresa.pacientes.map((paciente) => {
        const ultimoApto = paciente.aptos[0];

        return {
          id: paciente.id,
          dni: paciente.dni,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          puesto: paciente.puesto,
          estadoAptitud: ultimoApto?.estadoAptitud ?? "PENDIENTE",
          fechaVencimiento: ultimoApto?.fechaVencimiento ?? null,
        };
      });

      return res.json({
        mensaje: "Trabajadores obtenidos correctamente.",
        empresa: {
          id: empresa.id,
          razonSocial: empresa.razonSocial,
          cuit: empresa.cuit,
        },
        trabajadores,
      });
    } catch (error) {
      console.error("Error al obtener trabajadores de la empresa:", error);

      return res.status(500).json({
        mensaje: "No se pudieron obtener los trabajadores.",
      });
    }
  },
);

// EMPRESA: obtener sedes disponibles para solicitar turnos.
empresasRouter.get(
  "/empresa/sedes",
  autenticar,
  permitirRoles("EMPRESA"),
  async (_req, res) => {
    try {
      const sedes = await prisma.sede.findMany({
        orderBy: {
          nombre: "asc",
        },
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      });

      return res.json({
        mensaje: "Sedes obtenidas correctamente.",
        sedes,
      });
    } catch (error) {
      console.error("Error al obtener sedes:", error);

      return res.status(500).json({
        mensaje: "No se pudieron obtener las sedes.",
      });
    }
  },
);

// EMPRESA: obtener solicitudes y turnos de sus trabajadores.
empresasRouter.get(
  "/empresa/turnos",
  autenticar,
  permitirRoles("EMPRESA"),
  async (req, res) => {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: {
          id: req.usuario!.id,
        },
        select: {
          empresaId: true,
        },
      });

      if (!usuario?.empresaId) {
        return res.status(404).json({
          mensaje: "No se encontró una empresa asociada a este usuario.",
        });
      }

      const solicitudes = await prisma.solicitudTurno.findMany({
        where: {
          paciente: {
            is: {
              empresaId: usuario.empresaId,
            },
          },
        },
        orderBy: {
          fechaPreferida: "desc",
        },
        select: {
          id: true,
          fechaPreferida: true,
          estado: true,
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
          sede: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
          turno: {
            select: {
              id: true,
              fechaHora: true,
              estado: true,
            },
          },
        },
      });

      const turnos = solicitudes.map((solicitud) => {
        let estado: "PENDIENTE" | "ASISTIO" | "CANCELADO";

        if (
          solicitud.estado === "RECHAZADA" ||
          solicitud.estado === "CANCELADA" ||
          solicitud.turno?.estado === "CANCELADO"
        ) {
          estado = "CANCELADO";
        } else if (solicitud.turno?.estado === "ASISTIO") {
          estado = "ASISTIO";
        } else {
          estado = "PENDIENTE";
        }

        return {
          id: solicitud.id,
          trabajadorId: solicitud.paciente.id,
          trabajador: `${solicitud.paciente.apellido}, ${solicitud.paciente.nombre}`,
          fechaHora: solicitud.turno?.fechaHora ?? solicitud.fechaPreferida,
          horaAConfirmar: !solicitud.turno,
          sedeId: solicitud.sede.id,
          sede: solicitud.sede.nombre,
          direccionSede: solicitud.sede.direccion,
          estado,
          estadoSolicitud: solicitud.estado,
        };
      });

      return res.json({
        mensaje: "Turnos de la empresa obtenidos correctamente.",
        turnos,
      });
    } catch (error) {
      console.error("Error al obtener turnos de la empresa:", error);

      return res.status(500).json({
        mensaje: "No se pudieron obtener los turnos de la empresa.",
      });
    }
  },
);

// CLÍNICA / ADMIN: obtener empresas y sus puestos.
empresasRouter.get(
  "/empresas",
  autenticar,
  permitirRoles("CLINICA", "ADMIN"),
  async (_req, res) => {
    try {
      const empresas = await prisma.empresa.findMany({
        include: {
          pacientes: {
            select: {
              id: true,
            },
          },
          puestos: {
            select: {
              id: true,
              nombrePuesto: true,
            },
          },
        },
      });

      res.json(empresas);
    } catch (error) {
      console.error("Error al obtener empresas:", error);

      res.status(500).json({
        error: "Error al obtener empresas",
      });
    }
  },
);

// CLÍNICA / ADMIN: cargar trabajadores y crear sus usuarios.
empresasRouter.post(
  "/trabajadores/carga-masiva",
  autenticar,
  permitirRoles("CLINICA", "ADMIN"),
  async (req, res) => {
    try {
      const { trabajadores } = req.body;

      if (!Array.isArray(trabajadores) || trabajadores.length === 0) {
        res.status(400).json({
          error: "La lista de trabajadores está vacía o es inválida.",
        });
        return;
      }

      let importados = 0;
      const errores: string[] = [];

      for (const [index, trabajador] of trabajadores.entries()) {
        try {
          const dni = String(trabajador.dni ?? "").trim();
          const nombre = String(trabajador.nombre ?? "").trim();
          const apellido = String(trabajador.apellido ?? "").trim();
          const cuitEmpresa = String(trabajador.cuitEmpresa ?? "").trim();
          const nombrePuesto = String(trabajador.nombrePuesto ?? "").trim();

          if (!dni || !nombre || !apellido || !cuitEmpresa || !nombrePuesto) {
            errores.push(`Fila ${index + 1}: Faltan datos obligatorios.`);
            continue;
          }

          const empresa = await prisma.empresa.findUnique({
            where: {
              cuit: cuitEmpresa,
            },
          });

          if (!empresa) {
            errores.push(`Fila ${index + 1}: Empresa no encontrada.`);
            continue;
          }

          const puesto = await prisma.puestoRequisito.findFirst({
            where: {
              nombrePuesto,
              empresaId: empresa.id,
            },
          });

          if (!puesto) {
            errores.push(
              `Fila ${index + 1}: Puesto no registrado para la empresa.`,
            );
            continue;
          }

          const passwordHash = await bcrypt.hash(dni, 10);

          await prisma.$transaction(async (tx) => {
            const paciente = await tx.paciente.upsert({
              where: {
                dni,
              },
              update: {
                nombre,
                apellido,
                empresaId: empresa.id,
                puestoId: puesto.id,
              },
              create: {
                dni,
                nombre,
                apellido,
                empresaId: empresa.id,
                puestoId: puesto.id,
              },
            });

            await tx.usuario.upsert({
              where: {
                pacienteId: paciente.id,
              },
              update: {
                email: dni,
                passwordHash,
                rol: "PACIENTE",
              },
              create: {
                email: dni,
                passwordHash,
                rol: "PACIENTE",
                pacienteId: paciente.id,
              },
            });
          });

          importados++;
        } catch (error) {
          console.error(`Error en fila ${index + 1}:`, error);

          errores.push(
            `Fila ${index + 1}: No se pudo procesar el trabajador.`,
          );
        }
      }

      res.json({
        mensaje: `Proceso finalizado. Se importaron ${importados} trabajadores correctamente y se crearon o actualizaron sus cuentas de acceso.`,
        totalErrores: errores.length,
        detallesErrores: errores,
      });
    } catch (error) {
      console.error("Error en carga masiva:", error);

      res.status(500).json({
        error: "Error interno en la carga masiva",
      });
    }
  },
);
