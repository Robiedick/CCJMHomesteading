import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export async function POST(request: Request) {
  // Configure Cloudinary at runtime (not build time)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // Debug: Check if Cloudinary is configured
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary env vars missing:', {
      cloudName: !!cloudName,
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
    });
    return NextResponse.json(
      { message: "Server configuration error. Check Cloudinary credentials." },
      { status: 500 }
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ message: "Unsupported file type." }, { status: 415 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "File is too large." }, { status: 413 });
  }

  try {
    console.log('Starting Cloudinary upload...');
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Buffer created, size: ${buffer.length} bytes`);

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "ccjm-homesteading",
            resource_type: "auto",
            public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}`,
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload_stream error:', error);
              reject(error);
            } else {
              console.log('Cloudinary upload successful:', result?.secure_url);
              resolve(result as { secure_url: string });
            }
          }
        )
        .end(buffer);
    });

    // Return the secure URL
    return NextResponse.json({ url: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload image.";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}
