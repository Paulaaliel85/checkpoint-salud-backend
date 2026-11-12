
import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const rl = createInterface({ input, output });

async function main() {
  const email = (await rl.question("Email del administrador: "))
    .trim()
    .toLowerCase();

  const password = await rl.question("Contraseña del administrador: ");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Ingresá un email válido.");
  }

  if (password.length < 12) {
    throw new Error("La contraseña debe tener al menos 12 caracteres.");
  }

  const existente = await prisma.usuario.findUnique({
    where: { email },
  });

  if (existente) {
    console.log("Ya existe un usuario con ese email. No se creó otro.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.create({
    data: {
      email,
      passwordHash,
      rol: "ADMIN",
    },
  });

  console.log("Administrador creado correctamente.");
}

main()
  .catch((error: unknown) => {
    console.error("No se pudo crear el administrador:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });

