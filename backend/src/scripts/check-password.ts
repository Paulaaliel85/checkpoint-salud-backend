
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

  const password = await rl.question("Contraseña que querés verificar: ");

  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    console.log("No se encontró un usuario con ese correo.");
    return;
  }

  const coincide = await bcrypt.compare(password, usuario.passwordHash);

  console.log(
    coincide
      ? "La contraseña coincide con la guardada."
      : "La contraseña NO coincide con la guardada.",
  );
}

main()
  .catch(() => {
    console.error("No se pudo realizar la verificación.");
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });

  