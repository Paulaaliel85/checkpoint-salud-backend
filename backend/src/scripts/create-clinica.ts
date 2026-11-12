
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

async function main() {
  const email = "clinica@checkpoint.test";
  const password = "ClinicaDemo2026!";

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    console.log("El usuario de Clínica ya existe.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      rol: "CLINICA",
    },
  });

  console.log("Usuario de Clínica creado correctamente.");
  console.log("Email:", email);
  console.log("Contraseña:", password);
}

main()
  .catch((error: unknown) => {
    console.error("No se pudo crear el usuario de Clínica:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
