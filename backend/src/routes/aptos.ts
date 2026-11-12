import express from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { autenticar, permitirRoles } from "../middlewares/auth.js";
import { prisma } from "../lib/prisma.js";
import { EstadoAptitud } from "../generated/prisma/enums.js";

const UPLOADS = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOADS, { recursive: true });

const RESULTADOS = [
  EstadoAptitud.APTO,
  EstadoAptitud.APTO_CON_OBSERVACIONES,
  EstadoAptitud.NO_APTO,
] as const;

type Resultado = (typeof RESULTADOS)[number];

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

const subida = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS),
    filename: (_req, _file, cb) =>
      cb(null, `aptitud-${randomUUID()}.pdf`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("SOLO_PDF"));
    }
  },
});

function recibirDocumento(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  subida.single("documento")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const grande = error.code === "LIMIT_FILE_SIZE";

      res.status(grande ? 413 : 400).json({
        mensaje: grande
          ? "El documento supera el máximo de 5 MB."
          : 'Subí un solo documento, en el campo "documento".',
      });
      return;
    }

    if (error instanceof Error && error.message === "SOLO_PDF") {
      res.status(400).json({
        mensaje: "El documento tiene que ser un PDF.",
      });
      return;
    }

    res.status(500).json({
      mensaje: "No se pudo recibir el documento.",
    });
  });
}

// Un PDF real empieza con "%PDF-".
function esPdf(ruta: string): boolean {
  const descriptor = fs.openSync(ruta, "r");

  try {
    const cabecera = Buffer.alloc(5);
    fs.readSync(descriptor, cabecera, 0, 5, 0);
    return cabecera.toString("latin1") === "%PDF-";
  } finally {
    fs.closeSync(descriptor);
  }
}

function descartar(archivo?: Express.Multer.File) {
  if (archivo) {
    fs.rm(archivo.path, { force: true }, () => {});
  }
}

// Fecha de hoy sin hora.
function hoy(): Date {
  const ahora = new Date();

  return new Date(
    Date.UTC(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
    ),
  );
}

// Suma meses sin desbordar a fin de mes.
function sumarMeses(base: Date, meses: number): Date {
  const resultado = new Date(
    Date.UTC(
      base.getUTCFullYear(),
      base.getUTCMonth() + meses,
      1,
    ),
  );

  const ultimoDia = new Date(
    Date.UTC(
      resultado.getUTCFullYear(),
      resultado.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  resultado.setUTCDate(
    Math.min(base.getUTCDate(), ultimoDia),
  );

  return resultado;
}

export const aptosRouter = express.Router();

// =====================================================
// CONSULTAR TODOS LOS APTOS PARA CONTROL DE VENCIMIENTOS
// Solo la clínica.
// =====================================================

aptosRouter.get(
  "/",
  autenticar,
  permitirRoles("CLINICA", "EMPRESA"),
  async (req, res) => {
    try {
      const rol = req.usuario?.rol;
      let empresaFiltro = {};

      if (rol === "EMPRESA") {
        const usuarioId = req.usuario?.id;
        const usuario = await prisma.usuario.findUnique({
          where: { id: usuarioId },
          select: { empresaId: true },
        });

        if (!usuario?.empresaId) {
          res.status(403).json({
            mensaje: "El usuario no está asociado a ninguna empresa.",
          });
          return;
        }

        empresaFiltro = {
          paciente: {
            empresaId: usuario.empresaId,
          },
        };
      }

      const aptos = await prisma.aptoMedico.findMany({
        where: {
          estadoAptitud: {
            in: [
              EstadoAptitud.APTO,
              EstadoAptitud.APTO_CON_OBSERVACIONES,
            ],
          },
          fechaVencimiento: {
            not: null,
          },
          ...empresaFiltro,
        },
        orderBy: {
          fechaVencimiento: "asc",
        },
        select: {
          id: true,
          estadoAptitud: true,
          fechaEmision: true,
          fechaVencimiento: true,
          paciente: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              empresa: {
                select: {
                  razonSocial: true,
                },
              },
              puesto: {
                select: {
                  nombrePuesto: true,
                },
              },
            },
          },
        },
      });

      res.json({
        mensaje: "Aptos médicos obtenidos correctamente.",
        aptos,
      });
    } catch (error) {
      console.error(
        "Error al obtener los aptos médicos:",
        error,
      );

      res.status(500).json({
        mensaje: "No se pudo obtener el listado de aptos médicos.",
      });
    }
  },
);

// =====================================================
// REGISTRAR EL RESULTADO DE UN EXAMEN
// Solo la clínica.
// =====================================================

aptosRouter.post(
  "/",
  autenticar,
  permitirRoles("CLINICA"),
  recibirDocumento,
  async (req, res) => {
    const archivo = req.file;

    const rechazar = (estado: number, mensaje: string) => {
      descartar(archivo);
      res.status(estado).json({ mensaje });
    };

    try {
      const {
        pacienteId,
        estadoAptitud,
        detalleClinico,
        fechaExamen,
        vigenciaMeses,
        turnoId,
      } = req.body ?? {};

      if (
        typeof pacienteId !== "string" ||
        !UUID.test(pacienteId)
      ) {
        rechazar(400, "Elegí un paciente.");
        return;
      }

      if (
        !(RESULTADOS as readonly string[]).includes(
          estadoAptitud,
        )
      ) {
        rechazar(400, "Elegí el resultado del examen.");
        return;
      }

      const examen =
        typeof fechaExamen === "string" && fechaExamen !== ""
          ? FECHA.test(fechaExamen)
            ? new Date(fechaExamen)
            : new Date(NaN)
          : hoy();

      if (Number.isNaN(examen.getTime())) {
        rechazar(400, "La fecha del examen no es válida.");
        return;
      }

      if (examen.getTime() > hoy().getTime()) {
        rechazar(400, "La fecha del examen no puede ser futura.");
        return;
      }

      if (
        turnoId !== undefined &&
        turnoId !== "" &&
        (typeof turnoId !== "string" || !UUID.test(turnoId))
      ) {
        rechazar(400, "El turno no es válido.");
        return;
      }

      const observaciones =
        typeof detalleClinico === "string"
          ? detalleClinico.trim()
          : "";

      if (observaciones.length > 2000) {
        rechazar(
          400,
          "Las observaciones superan los 2000 caracteres.",
        );
        return;
      }

      if (archivo && !esPdf(archivo.path)) {
        rechazar(400, "El archivo no es un PDF válido.");
        return;
      }

      const paciente = await prisma.paciente.findUnique({
        where: { id: pacienteId },
        select: {
          puesto: {
            select: {
              mesesVigencia: true,
            },
          },
        },
      });

      if (!paciente) {
        rechazar(404, "El paciente no existe.");
        return;
      }

      const vigencia =
        vigenciaMeses === undefined || vigenciaMeses === ""
          ? paciente.puesto.mesesVigencia
          : Number(vigenciaMeses);

      if (
        !Number.isInteger(vigencia) ||
        vigencia < 1 ||
        vigencia > 60
      ) {
        rechazar(
          400,
          "La vigencia tiene que ser de 1 a 60 meses.",
        );
        return;
      }

      const turnoElegido: string | null =
        typeof turnoId === "string" && turnoId !== ""
          ? turnoId
          : null;

      if (turnoElegido) {
        const turno = await prisma.turno.findFirst({
          where: {
            id: turnoElegido,
            pacienteId,
          },
          select: {
            apto: {
              select: {
                id: true,
              },
            },
          },
        });

        if (!turno) {
          rechazar(
            404,
            "El turno no corresponde a ese paciente.",
          );
          return;
        }

        if (turno.apto) {
          rechazar(
            409,
            "Ese turno ya tiene un apto registrado.",
          );
          return;
        }
      }

      const resultado = estadoAptitud as Resultado;

      const apto = await prisma.$transaction(async (tx) => {
        const creado = await tx.aptoMedico.create({
          data: {
            pacienteId,
            estadoAptitud: resultado,
            fechaEmision: examen,
            fechaVencimiento:
              resultado === EstadoAptitud.NO_APTO
                ? null
                : sumarMeses(examen, vigencia),
            detalleClinico: observaciones || null,
            documentoUrl: archivo?.filename ?? null,
            turnoId: turnoElegido,
          },
          select: {
            id: true,
            estadoAptitud: true,
            fechaEmision: true,
            fechaVencimiento: true,
            documentoUrl: true,
          },
        });

        if (turnoElegido) {
          await tx.turno.update({
            where: { id: turnoElegido },
            data: { estado: "ASISTIO" },
          });
        }

        return creado;
      });

      res.status(201).json({
        mensaje: "Apto registrado.",
        apto,
      });
    } catch (error) {
      console.error("Error al registrar el apto:", error);
      rechazar(500, "No se pudo registrar el apto.");
    }
  },
);

// =====================================================
// DESCARGAR EL DOCUMENTO DE UN APTO
// Solo la clínica.
// =====================================================

aptosRouter.get(
  "/:id/documento",
  autenticar,
  permitirRoles("CLINICA"),
  async (req, res) => {
    try {
      const id = req.params.id;

      if (typeof id !== "string" || !UUID.test(id)) {
        res.status(400).json({
          mensaje: "El identificador no es válido.",
        });
        return;
      }

      const apto = await prisma.aptoMedico.findUnique({
        where: { id },
        select: {
          documentoUrl: true,
        },
      });

      if (!apto?.documentoUrl) {
        res.status(404).json({
          mensaje: "Este apto no tiene documento.",
        });
        return;
      }

      const ruta = path.resolve(
        UPLOADS,
        path.basename(apto.documentoUrl),
      );

      if (
        !ruta.startsWith(UPLOADS + path.sep) ||
        !fs.existsSync(ruta)
      ) {
        res.status(404).json({
          mensaje: "El documento no está disponible.",
        });
        return;
      }

      res.download(ruta, "certificado-de-aptitud.pdf");
    } catch {
      res.status(500).json({
        mensaje: "No se pudo obtener el documento.",
      });
    }
  },
);

// =====================================================
// CONSULTAR EL ÚLTIMO APTO DEL PACIENTE AUTENTICADO
// Solo el paciente.
// =====================================================

aptosRouter.get(
  "/paciente/actual",
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

      const apto = await prisma.aptoMedico.findFirst({
        where: {
          pacienteId: usuario.pacienteId,
        },
        orderBy: {
          fechaEmision: "desc",
        },
        select: {
          id: true,
          estadoAptitud: true,
          fechaEmision: true,
          fechaVencimiento: true,
        },
      });

      if (!apto) {
        res.status(404).json({
          mensaje: "Todavía no tenés un apto médico registrado.",
        });
        return;
      }

      res.json({
        mensaje: "Apto obtenido correctamente.",
        apto,
      });
    } catch (error) {
      console.error(
        "Error al obtener el apto del paciente:",
        error,
      );

      res.status(500).json({
        mensaje: "No se pudo obtener el apto médico.",
      });
    }
  },
);