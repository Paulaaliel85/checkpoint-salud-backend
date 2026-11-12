-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('CLINICA', 'EMPRESA', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('PENDIENTE', 'ASISTIO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoAptitud" AS ENUM ('APTO', 'NO_APTO', 'PENDIENTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "empresa_id" UUID,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" UUID NOT NULL,
    "razon_social" VARCHAR(255) NOT NULL,
    "cuit" VARCHAR(20) NOT NULL,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puestos_requisitos" (
    "id" UUID NOT NULL,
    "nombre_puesto" VARCHAR(150) NOT NULL,
    "meses_vigencia" INTEGER NOT NULL,
    "empresa_id" UUID NOT NULL,

    CONSTRAINT "puestos_requisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sedes" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "direccion" VARCHAR(255) NOT NULL,

    CONSTRAINT "sedes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pacientes" (
    "id" UUID NOT NULL,
    "dni" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "empresa_id" UUID NOT NULL,
    "puesto_id" UUID NOT NULL,

    CONSTRAINT "pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" UUID NOT NULL,
    "fecha_hora" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'PENDIENTE',
    "paciente_id" UUID NOT NULL,
    "sede_id" UUID NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aptos_medicos" (
    "id" UUID NOT NULL,
    "fecha_emision" DATE,
    "fecha_vencimiento" DATE,
    "estado_aptitud" "EstadoAptitud" NOT NULL DEFAULT 'PENDIENTE',
    "detalle_clinico" TEXT,
    "documento_url" VARCHAR(500),
    "turno_id" UUID,
    "paciente_id" UUID NOT NULL,

    CONSTRAINT "aptos_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cuit_key" ON "empresas"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "puestos_requisitos_nombre_puesto_empresa_id_key" ON "puestos_requisitos"("nombre_puesto", "empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "pacientes_dni_key" ON "pacientes"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "aptos_medicos_turno_id_key" ON "aptos_medicos"("turno_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puestos_requisitos" ADD CONSTRAINT "puestos_requisitos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pacientes" ADD CONSTRAINT "pacientes_puesto_id_fkey" FOREIGN KEY ("puesto_id") REFERENCES "puestos_requisitos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aptos_medicos" ADD CONSTRAINT "aptos_medicos_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aptos_medicos" ADD CONSTRAINT "aptos_medicos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
