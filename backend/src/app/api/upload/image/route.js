import { requireActiveUser, AuthError } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { uploadImageSchema } from "@/validations/upload.validation";
import { success, error } from "@/lib/response";
import { withRequestLogging } from "@/lib/logger";
import { rateLimitOrError } from "@/lib/rateLimit";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Magic-byte signatures for each allowed type — the declared `file.type` on
// a multipart part is just a client-supplied label, not a guarantee of the
// actual bytes, so a renamed/relabeled non-image could otherwise sail
// through the MIME check above. Checked against the real buffer before
// anything is forwarded to Cloudinary.
const SIGNATURE_CHECKS = {
  "image/jpeg": (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  "image/png": (buf) =>
    buf.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => buf[i] === byte),
  "image/gif": (buf) =>
    buf.length >= 4 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38,
  "image/webp": (buf) =>
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP",
};

function matchesDeclaredImageType(buffer, mimeType) {
  const check = SIGNATURE_CHECKS[mimeType];
  return check ? check(buffer) : false;
}

// Bounded so a slow/unresponsive Cloudinary call fails predictably instead
// of hanging until the platform's own request limit kicks in. Retried
// exactly once below on a timeout — Cloudinary occasionally returns 499
// (Request Timeout) under load, and a same-request retry clears most of
// those without the client needing to resubmit the whole multipart body.
const CLOUDINARY_TIMEOUT_MS = 20000;
const isDev = process.env.NODE_ENV !== "production";

function isCloudinaryTimeout(err) {
  return err?.http_code === 499 || err?.name === "TimeoutError" || /timeout/i.test(err?.message || "");
}

async function handlePOST(request) {
  try {
    let user;
    try {
      user = await requireActiveUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

    const limited = await rateLimitOrError({
      key: `upload-image:user:${user.id}`,
      limit: 30,
      windowSeconds: 60 * 60,
    });
    if (limited) return limited;

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return error("Request must be multipart/form-data", 400);
    }

    const file = formData.get("image");
    if (!(file instanceof Blob) || file.size === 0) {
      return error("Image file is required", 400);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return error("Only JPEG, PNG, WEBP, and GIF images are allowed", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return error("Image must be 10MB or smaller", 400);
    }

    const parsed = uploadImageSchema.safeParse({ folder: formData.get("folder") });
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid input";
      return error(message, 400);
    }

    // Cloudinary's upload() accepts a data URI directly, which avoids the
    // stream-handling that Buffer/upload_stream would otherwise need in a
    // route handler.
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!matchesDeclaredImageType(buffer, file.type)) {
      return error("File content doesn't match a valid image of the declared type", 400);
    }

    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadOptions = {
      folder: `foundly/${parsed.data.folder}`,
      resource_type: "image",
      timeout: CLOUDINARY_TIMEOUT_MS,
    };

    let result;
    try {
      result = await cloudinary.uploader.upload(dataUri, uploadOptions);
    } catch (err) {
      if (!isCloudinaryTimeout(err)) {
        if (isDev) console.error("Cloudinary upload error:", err);
        return error("Failed to upload image", 502);
      }

      if (isDev) console.warn("Cloudinary upload timed out, retrying once:", err.message);
      try {
        result = await cloudinary.uploader.upload(dataUri, uploadOptions);
      } catch (retryErr) {
        if (isDev) console.error("Cloudinary upload error (after retry):", retryErr);
        return error("Failed to upload image. Please try again.", 502);
      }
    }

    return success(
      {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
      "Image uploaded successfully"
    );
  } catch (err) {
    if (isDev) console.error("Upload image error:", err);
    return error("Something went wrong while uploading the image", 500);
  }
}

export const POST = withRequestLogging(handlePOST, { route: "/api/upload/image" });
