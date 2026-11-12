-- CreateEnum
CREATE TYPE "EstadoSolicitudTurno" AS ENUM ('PENDIENTE', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "solicitudes_turnos" (
    "id" UUID NOT NULL,
    "fecha_preferida" DATE NOT NULL,
    "estado" "EstadoSolicitudTurno" NOT NULL DEFAULT 'PENDIENTE',
    "paciente_id" UUID NOT NULL,
    "sede_id" UUID NOT NULL,
    "turno_id" UUID,

    CONSTRAINT "solicitudes_turnos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_turnos_turno_id_key" ON "solicitudes_turnos"("turno_id");

-- AddForeignKey
ALTER TABLE "solicitudes_turnos" ADD CONSTRAINT "solicitudes_turnos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_turnos" ADD CONSTRAINT "solicitudes_turnos_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes_turnos" ADD CONSTRAINT "solicitudes_turnos_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
