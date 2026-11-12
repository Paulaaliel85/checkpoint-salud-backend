
import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { autenticar, permitirRoles } from "../middlewares/auth.js";

export const usuariosRouter = Router();

type RolPersonal = "CLINICA" | "EMPRESA" | "ADMIN";

const ROLES_PERSONAL: RolPersonal[] = ["CLINICA", "EMPRESA", "ADMIN"];

function esRolPersonal(rol: unknown): rol is RolPersonal {
  return typeof rol === "string" && ROLES_PERSONAL.includes(rol as RolPersonal);
}

function puedeGestionarUsuario(
  rolGestor: string,
  rolUsuario: string
): boolean {
  if (rolGestor === "ADMIN") {
    return ROLES_PERSONAL.includes(rolUsuario as RolPersonal);
  }

  if (rolGestor === "CLINICA") {
    return rolUsuario === "EMPRESA";
  }

  return false;
}



usuariosRouter.get(
  "/",
  autenticar,
  permitirRoles("CLINICA", "ADMIN"),
  async (req, res) => {
    try {
      const rolesPermitidos: RolPersonal[] =
        req.usuario?.rol === "ADMIN"
          ? ["CLINICA", "EMPRESA", "ADMIN"]
          : ["EMPRESA"];

      const usuarios = await prisma.usuario.findMany({
        where: {
          rol: {
            in: rolesPermitidos,
          },
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
          empresa: {
            select: {
              id: true,
              razonSocial: true,
            },
          },
          creadoEn: true,
        },
        orderBy: {
          creadoEn: "desc",
        },
      });

      return res.json(usuarios);
    } catch (error) {
      console.error("Error al listar usuarios:", error);

      return res.status(500).json({
        mensaje: "Error al obtener los usuarios",
      });
    }
  }
);


usuariosRouter.post(
  "/",
  autenticar,
  permitirRoles("CLINICA", "ADMIN"),
  async (req, res) => {
    try {
      const {
        nombre,
        apellido,
        email,
        password,
        rol,
        empresaId,
      } = req.body ?? {};

      const nombreLimpio =
        typeof nombre === "string" ? nombre.trim() : "";

      const apellidoLimpio =
        typeof apellido === "string" ? apellido.trim() : "";

      const emailLimpio =
        typeof email === "string" ? email.trim().toLowerCase() : "";

      if (
        !nombreLimpio ||
        !apellidoLimpio ||
        !emailLimpio ||
        !password ||
        !rol
      ) {
        return res.status(400).json({
          mensaje: "Todos los campos obligatorios deben completarse",
        });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio)) {
        return res.status(400).json({
          mensaje: "El email no es válido",
        });
      }

      if (typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
          mensaje: "La contraseña debe tener al menos 8 caracteres",
        });
      }

      if (!esRolPersonal(rol)) {
        return res.status(400).json({
          mensaje: "El rol seleccionado no es válido",
        });
      }

      if (rol === "ADMIN" && req.usuario?.rol !== "ADMIN") {
        return res.status(403).json({
          mensaje: "Solo un administrador puede crear otro administrador",
        });
      }

      if (rol === "EMPRESA") {
        if (typeof empresaId !== "string" || !empresaId.trim()) {
          return res.status(400).json({
            mensaje: "Debe seleccionar una empresa",
          });
        }

        const empresa = await prisma.empresa.findUnique({
          where: {
            id: empresaId,
          },
        });

        if (!empresa) {
          return res.status(404).json({
            mensaje: "La empresa seleccionada no existe",
          });
        }
      }

      const usuarioExistente = await prisma.usuario.findUnique({
        where: {
          email: emailLimpio,
        },
      });

      if (usuarioExistente) {
        return res.status(409).json({
          mensaje: "Ya existe un usuario registrado con ese email",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const nuevoUsuario = await prisma.usuario.create({
        data: {
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
          email: emailLimpio,
          passwordHash,
          rol,
          empresaId: rol === "EMPRESA" ? empresaId : null,
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
          empresa: {
            select: {
              id: true,
              razonSocial: true,
            },
          },
        },
      });

      return res.status(201).json({
        mensaje: "Usuario creado correctamente",
        usuario: nuevoUsuario,
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);

      return res.status(500).json({
        mensaje: "Error al crear el usuario",
      });
    }
  }
);


usuariosRouter.patch(
  "/:id",
  autenticar,
  permitirRoles("CLINICA", "ADMIN"),
  async (req, res) => {
    try {
      const idParametro = req.params.id;
      const id = Array.isArray(idParametro)
        ? idParametro[0]
        : idParametro;

      if (typeof id !== "string" || !id.trim()) {
        return res.status(400).json({
          mensaje: "El ID del usuario no es válido",
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: {
          id: id,
        },
      });

      if (!usuario) {
        return res.status(404).json({
          mensaje: "El usuario no existe",
        });
      }

      if (!puedeGestionarUsuario(req.usuario?.rol ?? "", usuario.rol)) {
        return res.status(403).json({
          mensaje: "No tenés permiso para modificar este usuario",
        });
      }

      const {
        nombre,
        apellido,
        email,
        empresaId,
      } = req.body ?? {};

      const datosActualizar: {
        nombre?: string;
        apellido?: string;
        email?: string;
        empresaId?: string | null;
      } = {};

      if (nombre !== undefined) {
        if (typeof nombre !== "string" || !nombre.trim()) {
          return res.status(400).json({
            mensaje: "El nombre no es válido",
          });
        }

        datosActualizar.nombre = nombre.trim();
      }

      if (apellido !== undefined) {
        if (typeof apellido !== "string" || !apellido.trim()) {
          return res.status(400).json({
            mensaje: "El apellido no es válido",
          });
        }

        datosActualizar.apellido = apellido.trim();
      }

      if (email !== undefined) {
        if (
          typeof email !== "string" ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
          return res.status(400).json({
            mensaje: "El email no es válido",
          });
        }

        const emailLimpio = email.trim().toLowerCase();

        const emailExistente = await prisma.usuario.findUnique({
          where: {
            email: emailLimpio,
          },
        });

        if (emailExistente && emailExistente.id !== id) {
          return res.status(409).json({
            mensaje: "Ese email ya está registrado",
          });
        }

        datosActualizar.email = emailLimpio;
      }

      if (usuario.rol === "EMPRESA" && empresaId !== undefined) {
        if (typeof empresaId !== "string" || !empresaId.trim()) {
          return res.status(400).json({
            mensaje: "Debe seleccionar una empresa válida",
          });
        }

        const empresa = await prisma.empresa.findUnique({
          where: {
            id: empresaId,
          },
        });

        if (!empresa) {
          return res.status(404).json({
            mensaje: "La empresa seleccionada no existe",
          });
        }

        datosActualizar.empresaId = empresaId;
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: {
          id: id,
        },
        data: datosActualizar,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
          empresa: {
            select: {
              id: true,
              razonSocial: true,
            },
          },
        },
      });

      return res.json({
        mensaje: "Usuario actualizado correctamente",
        usuario: usuarioActualizado,
      });
    } catch (error) {
      console.error("Error al actualizar usuario:", error);

      return res.status(500).json({
        mensaje: "Error al actualizar el usuario",
      });
    }
  }
);


usuariosRouter.patch(
  "/:id/estado",
  autenticar,
  permitirRoles("CLINICA", "ADMIN"),
  async (req, res) => {
    try {
      const idParametro = req.params.id;
      const id = Array.isArray(idParametro)
        ? idParametro[0]
        : idParametro;

      if (typeof id !== "string" || !id.trim()) {
        return res.status(400).json({
          mensaje: "El ID del usuario no es válido",
        });
      }

      const { activo } = req.body ?? {};

      if (typeof activo !== "boolean") {
        return res.status(400).json({
          mensaje: "Debe indicar si el usuario estará activo o inactivo",
        });
      }

      if (req.usuario?.id === id && activo === false) {
        return res.status(400).json({
          mensaje: "No podés desactivar tu propia cuenta",
        });
      }

      const usuario = await prisma.usuario.findUnique({
        where: {
          id: id,
        },
      });

      if (!usuario) {
        return res.status(404).json({
          mensaje: "El usuario no existe",
        });
      }

      if (!puedeGestionarUsuario(req.usuario?.rol ?? "", usuario.rol)) {
        return res.status(403).json({
          mensaje: "No tenés permiso para modificar este usuario",
        });
      }

      const usuarioActualizado = await prisma.usuario.update({
        where: {
          id: id,
        },
        data: {
          activo,
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
          activo: true,
        },
      });

      return res.json({
        mensaje: activo
          ? "Usuario activado correctamente"
          : "Usuario desactivado correctamente",
        usuario: usuarioActualizado,
      });
    } catch (error) {
      console.error("Error al cambiar el estado del usuario:", error);

      return res.status(500).json({
        mensaje: "Error al cambiar el estado del usuario",
      });
    }
  }
);
