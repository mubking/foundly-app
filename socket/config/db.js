import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let connectionPromise = null;

/**
 * Connects to the same MongoDB database as backend/, reusing the
 * connection across calls. Unlike backend/src/lib/db.js this doesn't need
 * to cache on `global` — this process doesn't hot-reload per request.
 */
export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGODB_URI)
      .then((mongooseInstance) => {
        logger.info("MongoDB connected");
        return mongooseInstance.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

export default connectDB;
