import "dotenv/config";
import Joi from "joi";

const esquema = Joi.object({
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default("2h"),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:5174"),
}).unknown(true);

const { error, value } = esquema.validate(process.env, { abortEarly: false });

if (error) {
  console.error("Variables de entorno inválidas:");
  for (const detalle of error.details) {
    console.error(" -", detalle.message);
  }
  process.exit(1);
}

export const env = value as {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  FRONTEND_URL: string;
};