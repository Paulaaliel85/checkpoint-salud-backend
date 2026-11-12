
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export const authRouter = express.Router();

// Inicio de sesión
authRouter.post("/auth/login", async (req, res) => {
  try {
    const { identificador, password } = req.body ?? {};

    if (
      typeof identificador !== "string" ||
      typeof password !== "string" ||
      !identificador.trim() ||
      !password
    ) {
      res.status(400).json({
        mensaje: "Ingresá tu usuario y contraseña.",
      });
      return;
    }

    const dato = identificador.trim();
    const esEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dato);

    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          ...(esEmail ? [{ email: dato.toLowerCase() }] : []),
          {
            paciente: {
              is: {
                dni: dato,
              },
            },
          },
        ],
      },
    });

    if (!usuario) {
      res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos.",
      });
      return;
    }

    if (!usuario.activo) {
      res.status(403).json({
        mensaje: "Tu cuenta está desactivada. Contactá con la administración.",
      });
      return;
    }

    const contrasenaValida = await bcrypt.compare(
      password,
      usuario.passwordHash,
    );

    if (!contrasenaValida) {
      res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos.",
      });
      return;
    }

    const jwtSecret = env.JWT_SECRET;

    const token = jwt.sign(
      { rol: usuario.rol },
      jwtSecret,
      {
        subject: usuario.id,
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      },
    );

    res.json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("ERROR EN LOGIN:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al iniciar sesión.",
    });
  }
});
