import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/validations/auth.validation";
import { success, error } from "@/lib/response";
import { toPublicUser } from "@/lib/serializers";
import { rateLimitOrError } from "@/lib/rateLimit";
import { getRequestIp } from "@/lib/requestIp";

const SALT_ROUNDS = 12;

export async function POST(request) {
  try {
    const limited = await rateLimitOrError({
      key: `register:ip:${getRequestIp(request)}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (limited) return limited;

    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const { firstName, lastName, password, phone } = parsed.data;
    // Normalize casing ourselves: Mongoose's `lowercase: true` schema option
    // only runs when a document is saved, not on query filters, so a raw
    // findOne({ email }) would miss an existing "Alex@x.com" when checking
    // a new "alex@x.com" registration.
    const email = parsed.data.email.toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
    });

    return success(toPublicUser(user), "Account created successfully", 201);
  } catch (err) {
    console.error("Register error:", err);
    return error("Something went wrong while creating your account", 500);
  }
}
