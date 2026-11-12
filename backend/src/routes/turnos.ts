
import express from "express";
import { autenticar, permitirRoles } from "../middlewares/auth.js";
import { prisma } from "../lib/prisma.js";

export const turnosRouter = express.Router();

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

// EMPRESA: solicitar un turno para un trabajador.
turnosRouter.post(
  "/solicitudes",
  autenticar,
  permitirRoles("EMPRESA"),
  async (req, res) => {
    try {
      const usuarioId = req.usuario?.id;
      const { pacienteId, sedeId, fechaPreferida } = req.body ?? {};

      if (!usuarioId) {
        res.status(401).json({ mensaje: "Necesitás iniciar sesión." });
        return;
      }

      if (
        typeof pacienteId !== "string" ||
        !UUID.test(pacienteId) ||
        typeof sedeId !== "string" ||
        !UUID.test(sedeId)
      ) {
        res.status(400).json({
          mensaje: "El trabajador o la sede no son válidos.",
        });
        return;
      }

      if (
        typeof fechaPreferida !== "string" ||
        !FECHA.test(fechaPreferida)
      ) {
        res.status(400).json({
          mensaje: "Ingresá una fecha válida.",
        });
        return;
      }

      const fecha = new Date(`${fechaPreferida}T00:00:00.000Z`);

      if (
        Number.isNaN(fecha.getTime()) ||
        fecha.toISOString().slice(0, 10) !== fechaPreferida
      ) {
        res.status(400).json({ mensaje: "La fecha no es válida." });
        return;
      }

      const fechaHoy = new Date();
      fechaHoy.setUTCHours(0, 0, 0, 0);

      if (fecha < fechaHoy) {
        res.status(400).json({
          mensaje: "La fecha preferida no puede ser anterior a hoy.",
        });
        return;
      }

      // Obtener la empresa desde el usuario autenticado.
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { empresaId: true },
      });

      if (!usuario?.empresaId) {
        res.status(403).json({
          mensaje: "El usuario no tiene una empresa asociada.",
        });
        return;
      }

      // Verificar que el trabajador pertenezca a esa empresa.
      const paciente = await prisma.paciente.findFirst({
        where: {
          id: pacienteId,
          empresaId: usuario.empresaId,
        },
        select: { id: true },
      });

      if (!paciente) {
        res.status(404).json({
          mensaje: "El trabajador no pertenece a tu empresa.",
        });
        return;
      }

      const sede = await prisma.sede.findUnique({
        where: { id: sedeId },
        select: { id: true },
      });

      if (!sede) {
        res.status(404).json({ mensaje: "La sede no existe." });
        return;
      }

      // Evitar solicitudes pendientes duplicadas.
      const solicitudExistente = await prisma.solicitudTurno.findFirst({
        where: {
          pacienteId,
          estado: "PENDIENTE",
        },
      });

      if (solicitudExistente) {
        res.status(409).json({
          mensaje: "El trabajador ya tiene una solicitud pendiente.",
        });
        return;
      }

      const solicitud = await prisma.solicitudTurno.create({
        data: {
          pacienteId,
          sedeId,
          fechaPreferida: fecha,
        },
        select: {
          id: true,
          fechaPreferida: true,
          estado: true,
          paciente: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
          sede: {
            select: {
              nombre: true,
              direccion: true,
            },
          },
        },
      });

      res.status(201).json({
        mensaje: "Solicitud de turno creada correctamente.",
        solicitud,
      });
    } catch (error) {
      console.error("Error al solicitar turno:", error);
      res.status(500).json({
        mensaje: "No se pudo crear la solicitud de turno.",
      });
    }
  },
);

// CLÍNICA: consultar solicitudes de turnos.
turnosRouter.get(
  "/solicitudes",
  autenticar,
  permitirRoles("CLINICA"),
  async (_req, res) => {
    try {
      const solicitudes = await prisma.solicitudTurno.findMany({
        orderBy: { fechaPreferida: "asc" },
        include: {
          paciente: {
            include: {
              empresa: true,
              puesto: true,
            },
          },
          sede: true,
        },
      });

      res.json({
        mensaje: "Solicitudes obtenidas correctamente.",
        solicitudes,
      });
    } catch (error) {
      console.error("Error al obtener solicitudes:", error);
      res.status(500).json({
        mensaje: "No se pudieron obtener las solicitudes.",
      });
    }
  },
);

// CLÍNICA: confirmar solicitud y asignar fecha y hora.
turnosRouter.patch(
  "/solicitudes/:id/confirmar",
  autenticar,
  permitirRoles("CLINICA"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { fechaHora } = req.body ?? {};

      if (typeof id !== "string" || !UUID.test(id)) {
        res.status(400).json({ mensaje: "El identificador no es válido." });
        return;
      }

      if (
        typeof fechaHora !== "string" ||
        Number.isNaN(Date.parse(fechaHora)) ||
        !fechaHora.includes("T")
      ) {
        res.status(400).json({
          mensaje: "Ingresá una fecha y hora válidas.",
        });
        return;
      }

      const fechaAsignada = new Date(fechaHora);

      if (fechaAsignada <= new Date()) {
        res.status(400).json({
          mensaje: "El turno debe asignarse para una fecha futura.",
        });
        return;
      }

      const solicitud = await prisma.solicitudTurno.findUnique({
        where: { id },
      });

      if (!solicitud) {
        res.status(404).json({
          mensaje: "La solicitud no existe.",
        });
        return;
      }

      if (solicitud.estado !== "PENDIENTE") {
        res.status(409).json({
          mensaje: "La solicitud ya fue procesada.",
        });
        return;
      }

      const turno = await prisma.$transaction(async (tx) => {
        const creado = await tx.turno.create({
          data: {
            fechaHora: fechaAsignada,
            pacienteId: solicitud.pacienteId,
            sedeId: solicitud.sedeId,
          },
        });

        await tx.solicitudTurno.update({
          where: { id },
          data: {
            estado: "CONFIRMADA",
            turnoId: creado.id,
          },
        });

        return creado;
      });

      res.json({
        mensaje: "Solicitud confirmada y turno asignado correctamente.",
        turno,
      });
    } catch (error) {
      console.error("Error al confirmar solicitud:", error);
      res.status(500).json({
        mensaje: "No se pudo confirmar la solicitud.",
      });
    }
  },
);

// CLÍNICA: rechazar solicitud.
turnosRouter.patch(
  "/solicitudes/:id/rechazar",
  autenticar,
  permitirRoles("CLINICA"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (typeof id !== "string" || !UUID.test(id)) {
        res.status(400).json({
          mensaje: "El identificador no es válido.",
        });
        return;
      }

      const solicitud = await prisma.solicitudTurno.findUnique({
        where: { id },
      });

      if (!solicitud) {
        res.status(404).json({
          mensaje: "La solicitud no existe.",
        });
        return;
      }

      if (solicitud.estado !== "PENDIENTE") {
        res.status(409).json({
          mensaje: "La solicitud ya fue procesada.",
        });
        return;
      }

      await prisma.solicitudTurno.update({
        where: { id },
        data: { estado: "RECHAZADA" },
      });

      res.json({
        mensaje: "Solicitud rechazada correctamente.",
      });
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      res.status(500).json({
        mensaje: "No se pudo rechazar la solicitud.",
      });
    }
  },
);
