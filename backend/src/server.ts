
import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { usuariosRouter } from "./routes/usuarios.js";
import { prisma } from "./lib/prisma.js";
import { autenticar, permitirRoles } from "./middlewares/auth.js";
import { aptosRouter } from "./routes/aptos.js";
import { turnosRouter } from "./routes/turnos.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/aptos", aptosRouter);
app.use("/api/turnos", turnosRouter);
app.use("/api/usuarios", usuariosRouter);
// Ruta principal
app.get("/", (_req, res) => {
  res.json({
    mensaje: "Backend de CheckPoint Salud funcionando correctamente",
  });
});

// Comprobar conexión con la base de datos
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      estado: "OK",
      servidor: "funcionando",
      baseDeDatos: "conectada",
    });
  } catch (error) {
    console.error("Error al comprobar la base de datos:", error);

    res.status(500).json({
      estado: "ERROR",
      mensaje: "No se pudo conectar con la base de datos",
    });
  }
});

// Inicio de sesión: correo para personal y DNI para pacientes
app.post("/api/auth/login", async (req, res) => {
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

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("ERROR LOGIN: JWT_SECRET no está configurado.");

      res.status(500).json({
        mensaje: "El servicio de autenticación no está configurado.",
      });
      return;
    }

    const token = jwt.sign(
      { rol: usuario.rol },
      jwtSecret,
      {
        subject: usuario.id,
        expiresIn: "2h",
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

// Acceso Clínica
app.get(
  "/api/clinica",
  autenticar,
  permitirRoles("CLINICA"),
  (_req, res) => {
    res.json({
      mensaje: "Acceso permitido: panel de Clínica.",
    });
  },
);

// ==========================================
// RUTAS DE EMPRESA
// ==========================================

// Obtener trabajadores de la empresa autenticada
app.get(
  "/api/empresa/trabajadores",
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

// Obtener sedes disponibles para solicitar turnos
app.get(
  "/api/empresa/sedes",
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

// Obtener solicitudes y turnos de los trabajadores de la empresa
app.get(
  "/api/empresa/turnos",
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

// ==========================================
// ACCESO ADMINISTRADOR
// ==========================================

app.get(
  "/api/admin",
  autenticar,
  permitirRoles("ADMIN"),
  (_req, res) => {
    res.json({
      mensaje: "Acceso permitido: panel de Administración.",
    });
  },
);

// ==========================================
// RUTAS DE PACIENTE
// ==========================================

// Próximos turnos del paciente
app.get(
  "/api/paciente/turnos",
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
          mensaje: "El usuario no tiene un paciente asociado.",
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

// ==========================================
// RUTAS DE CLÍNICA Y ADMINISTRACIÓN
// ==========================================

// Obtener empresas y sus puestos
app.get(
  "/api/empresas",
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

// Obtener turnos para Clínica
app.get(
  "/api/turnos",
  autenticar,
  permitirRoles("CLINICA"),
  async (_req, res) => {
    try {
      const turnos = await prisma.turno.findMany({
        include: {
          paciente: {
            include: {
              empresa: true,
            },
          },
          sede: true,
        },
      });

      res.json(turnos);
    } catch (error) {
      console.error("Error al obtener turnos:", error);

      res.status(500).json({
        error: "Error al obtener turnos",
      });
    }
  },
);

// Carga de trabajadores y creación de sus usuarios
app.post(
  "/api/trabajadores/carga-masiva",
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de CheckPoint Salud en http://localhost:${PORT}`);
});
