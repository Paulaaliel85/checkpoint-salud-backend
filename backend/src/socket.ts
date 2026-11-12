import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

let io: Server | null = null;

export function iniciarSocket(servidor: HttpServer) {
  io = new Server(servidor, {
    cors: { origin: env.FRONTEND_URL },
  });

  // Cada conexión se autentica con el mismo JWT que usa la API.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (typeof token !== "string") {
        return next(new Error("Token requerido"));
      }

      const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

      // El rol y la empresa salen de la base, no del cliente.
      const usuario = await prisma.usuario.findUnique({
        where: { id: payload.sub as string },
        select: { id: true, rol: true, empresaId: true, pacienteId: true },
      });

      if (!usuario) {
        return next(new Error("Usuario no encontrado"));
      }

      socket.data.usuario = usuario;
      next();
    } catch {
      next(new Error("Token inválido o vencido"));
    }
  });
  

  io.on("connection", (socket) => {
  const { rol, empresaId, pacienteId } = socket.data.usuario;

  socket.join(`rol:${rol}`);

  if (empresaId) {
    socket.join(`empresa:${empresaId}`);
  }

  if (pacienteId) {
    socket.join(`paciente:${pacienteId}`);
  }
});
}

export function emitirARol(rol: string, evento: string, datos: unknown) {
  io?.to(`rol:${rol}`).emit(evento, datos);
}

export function emitirAEmpresa(empresaId: string, evento: string, datos: unknown) {
  io?.to(`empresa:${empresaId}`).emit(evento, datos);
}

export function emitirAPaciente(pacienteId: string, evento: string, datos: unknown) {
  io?.to(`paciente:${pacienteId}`).emit(evento, datos);
}