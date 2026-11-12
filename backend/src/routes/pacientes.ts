
import express from "express";
import { autenticar, permitirRoles } from "../middlewares/auth.js";
import { prisma } from "../lib/prisma.js";

export const pacientesRouter = express.Router();

// PACIENTE: consultar próximos turnos.
pacientesRouter.get(
  "/paciente/turnos",
  autenticar,
  permitirRoles("PACIENTE"),
  async (req, res) => {
    try {
      const usuarioId = req.usuario?.id;

      if (!usuarioId) {
        res.status(401).json({
          mensaje: "Necesitás iniciar sesión.",
        });
        return;
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          pacienteId: true,
        },
      });

      if (!usuario?.pacienteId) {
        res.status(404).json({
          mensaje: "No se encontró un paciente asociado a este usuario.",
        });
        return;
      }

      const turnos = await prisma.turno.findMany({
        where: {
          pacienteId: usuario.pacienteId,
          fechaHora: {
            gte: new Date(),
          },
          estado: "PENDIENTE",
        },
        orderBy: {
          fechaHora: "asc",
        },
        select: {
          id: true,
          fechaHora: true,
          estado: true,
          sede: {
            select: {
              nombre: true,
              direccion: true,
            },
          },
        },
      });

      res.json({
        mensaje: "Próximos turnos obtenidos correctamente.",
        turnos,
      });
    } catch (error) {
      console.error("Error al obtener turnos del paciente:", error);

      res.status(500).json({
        mensaje: "No se pudieron obtener los próximos turnos.",
      });
    }
  },
);
