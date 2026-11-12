/*
  Warnings:

  - A unique constraint covering the columns `[paciente_id]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'PACIENTE';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "paciente_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_paciente_id_key" ON "usuarios"("paciente_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
