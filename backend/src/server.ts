
import "dotenv/config";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { usuariosRouter } from "./routes/usuarios.js";
import { prisma } from "./lib/prisma.js";
import { autenticar, permitirRoles } from "./middlewares/auth.js";
import { authRouter } from "./routes/auth.js";
import { aptosRouter } from "./routes/aptos.js";
import { turnosRouter } from "./routes/turnos.js";
import { empresasRouter } from "./routes/empresas.js";
import { pacientesRouter } from "./routes/pacientes.js";

const app = express();
const PORT = env.PORT;

// Solo acepta requests desde el frontend configurado en .env
app.use(cors({origin: env.FRONTEND_URL })); 
app.use(express.json());

app.use("/api", authRouter);
app.use("/api/aptos", aptosRouter);
app.use("/api/turnos", turnosRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api", empresasRouter);
app.use("/api", pacientesRouter);

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

app.listen(PORT, () => {
  console.log(`Servidor de CheckPoint Salud en http://localhost:${PORT}`);
});

