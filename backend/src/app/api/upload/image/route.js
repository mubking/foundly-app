import { getAuthUser, AuthError } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";
import { uploadImageSchema } from "@/validations/upload.validation";
import { success, error } from "@/lib/response";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request) {
  try {
    let user;
    try {
      user = getAuthUser(request);
    } catch (err) {
      if (err instanceof AuthError) return error(err.message, err.status);
      throw err;
    }

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
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    let result;
    try {
      result = await cloudinary.uploader.upload(dataUri, {
        folder: `foundly/${parsed.data.folder}`,
        resource_type: "image",
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return error("Failed to upload image", 502);
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
    console.error("Upload image error:", err);
    return error("Something went wrong while uploading the image", 500);
  }
}
