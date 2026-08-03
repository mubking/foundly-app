import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing MONGODB_URI environment variable. Define it in .env.local."
  );
}

/**
 * Next.js reloads modules on every request in dev, which would otherwise
 * open a new MongoDB connection each time. Caching the connection (and the
 * in-flight connection promise) on `global` survives hot reloads and keeps
 * connection attempts from racing each other.
 */
let cached = global._mongoose;

if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

/**
 * Connects to MongoDB via Mongoose, reusing the cached connection when
 * one already exists.
 *
 * @returns {Promise<import("mongoose").Mongoose>}
 */
export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, options)
      .then((mongooseInstance) => mongooseInstance)
      .catch((error) => {
        // Reset the promise so the next call can retry instead of
        // permanently caching a failed connection attempt.
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.conn = null;
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }

  return cached.conn;
}

export default connectDB;
