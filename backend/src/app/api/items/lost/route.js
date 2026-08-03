import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { createLostItemSchema } from "@/validations/lost-item.validation";
import LostItem from "@/models/LostItem";
import { success, error } from "@/lib/response";

export async function POST(request) {
  try {
    // 1. Authenticate — read "Authorization: Bearer <token>".
    const authHeader = request.headers.get("authorization") || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return error("Missing or malformed Authorization header", 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return error("Invalid or expired token", 401);
    }

    // 2. Parse the request body.
    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    // 3. Validate. Zod strips any keys not declared in the schema (e.g.
    // "owner", "status" sent by a malicious client), so parsed.data can
    // never carry either — owner is set explicitly below regardless.
    const parsed = createLostItemSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    // 4. Connect to MongoDB and create the document.
    await connectDB();

    const lostItem = await LostItem.create({
      ...parsed.data,
      owner: decoded.id, // always from the verified token, never the body
      // status is intentionally omitted — the model defaults it to "open"
    });

    return success(lostItem, "Lost item reported successfully", 201);
  } catch (err) {
    if (err instanceof mongoose.Error.ValidationError) {
      const message = Object.values(err.errors)[0]?.message || "Invalid input";
      return error(message, 400);
    }

    console.error("Create lost item error:", err);
    return error("Something went wrong while reporting the lost item", 500);
  }
}
