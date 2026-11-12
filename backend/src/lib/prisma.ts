
import "dotenv/config";
import { env } from "../config/env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Falta configurar DATABASE_URL en el archivo .env");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
