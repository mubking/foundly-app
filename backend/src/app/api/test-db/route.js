import { connectDB } from "@/lib/db";
import { success, error } from "@/lib/response";

/**
 * Temporary route for verifying the MongoDB connection works end to end.
 * Safe to delete once the connection has been confirmed.
 */
export async function GET() {
  try {
    await connectDB();

    return success(undefined, "Database connected");
  } catch (err) {
    return error(err.message || "Database connection failed", 500);
  }
}
