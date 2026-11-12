import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';

async function run() {
  const email = 'cristianlescano@gmail.com';
  const passwordHash = await bcrypt.hash('pacienteLescano123', 12);
  
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      passwordHash,
      rol: 'PACIENTE'
    }
  });

  console.log('Paciente creado/actualizado correctamente:', usuario.email);
  await prisma.$disconnect();
}

run()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });