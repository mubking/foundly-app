import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/validations/auth.validation";
import { generateToken } from "@/lib/jwt";
import { success, error } from "@/lib/response";

// Same generic message for "no such user" and "wrong password" so the
// response never reveals which part of the credential pair was wrong.
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";

export async function POST(request) {
  try {
    await connectDB();

    let body;
    try {
      body = await request.json();
    } catch {
      return error("Invalid JSON in request body", 400);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    const email = parsed.data.email.toLowerCase();
    const { password } = parsed.data;

    // password has `select: false` on the schema, so it must be opted
    // back in explicitly to compare it here.
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return error(INVALID_CREDENTIALS_MESSAGE, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return error(INVALID_CREDENTIALS_MESSAGE, 401);
    }

    const token = generateToken({ id: user._id.toString(), role: user.role });

    return success(
      {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
        },
      },
      "Login successful"
    );
  } catch (err) {
    console.error("Login error:", err);
    return error("Something went wrong while logging in", 500);
  }
}
