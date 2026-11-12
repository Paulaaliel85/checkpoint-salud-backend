
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type Rol = "CLINICA" | "EMPRESA" | "ADMIN" | "PACIENTE";

export interface UsuarioAutenticado {
  id: string;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}

const ROLES_VALIDOS: Rol[] = ["CLINICA", "EMPRESA", "ADMIN", "PACIENTE"];

// Verifica el token. Sin sesión válida responde 401.
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    res.status(500).json({
      mensaje: "El servicio de autenticación no está configurado.",
    });
    return;
  }

  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    res.status(401).json({ mensaje: "Necesitás iniciar sesión." });
    return;
  }

  const token = encabezado.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.rol !== "string" ||
      !ROLES_VALIDOS.includes(payload.rol as Rol)
    ) {
      res.status(401).json({ mensaje: "La sesión no es válida." });
      return;
    }

    req.usuario = { id: payload.sub, rol: payload.rol as Rol };
    next();
  } catch {
    res.status(401).json({ mensaje: "La sesión expiró o no es válida." });
  }
}

// Comprueba el rol del token. Si no corresponde responde 403.
export function permitirRoles(...rolesPermitidos: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      res.status(401).json({ mensaje: "Necesitás iniciar sesión." });
      return;
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      res.status(403).json({
        mensaje: "No tenés permiso para acceder a este recurso.",
      });
      return;
    }

    next();
  };
}
