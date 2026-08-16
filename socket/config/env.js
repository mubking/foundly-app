import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable. Define it in .env.`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: required("MONGODB_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  // backend/'s REST API base — this service delegates message creation to
  // it (backend/src/services/message.service.js) rather than duplicating
  // that logic. Same host convention as mobile/constants/config.js.
  BACKEND_API_URL: process.env.BACKEND_API_URL || "http://localhost:3000/api",
  CORS_ORIGIN: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export default env;
