
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

async function main() {
  const email = "empresa@checkpoint.test";
  const password = "EmpresaDemo2026!";

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    console.log("El usuario de Empresa ya existe.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      rol: "EMPRESA",
    },
  });

  console.log("Usuario de Empresa creado correctamente.");
  console.log("Email:", email);
  console.log("Contraseña:", password);
}

main()
  .catch((error: unknown) => {
    console.error("No se pudo crear el usuario de Empresa:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
