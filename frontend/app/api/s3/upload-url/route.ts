import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getEnv } from "@/lib/get-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateFileName(fileName: string) {
  const now = new Date();
  const timestamp = now.getTime();

  const lastDotIndex = fileName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;
  const fileExtension = hasExtension
    ? fileName.substring(lastDotIndex + 1).toLowerCase()
    : "";

  const baseName = hasExtension
    ? fileName.substring(0, lastDotIndex)
    : fileName;

  const sanitizedBaseName = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100);

  return hasExtension
    ? `${sanitizedBaseName}_${timestamp}.${fileExtension}`
    : `${sanitizedBaseName}_${timestamp}`;
}

function sanitizeFolder(folder: string) {
  return folder
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .map((part) => part.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 100))
    .join("/");
}

export async function POST(request: Request) {
  const authData = await auth();
  if (!authData?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const bucketName = getEnv("AWS_BUCKET");

    const body = (await request.json()) as {
      fileName?: string;
      fileType?: string;
      folder?: string;
    };

    const originalName = body.fileName?.trim();
    if (!originalName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      );
    }

    const safeName = generateFileName(originalName);
    const rawFolder = body.folder?.trim();
    const folder = rawFolder ? sanitizeFolder(rawFolder) : undefined;
    const key = folder ? `${folder}/${safeName}` : safeName;

    const { data, error } = await getSupabaseAdmin()
      .storage.from(bucketName)
      .createSignedUploadUrl(key);

    if (error) {
      console.error("Failed to create signed upload URL", error);
      return NextResponse.json(
        { error: "Failed to create signed upload URL" },
        { status: 500 }
      );
    }

    const publicUrl = getSupabaseAdmin()
      .storage.from(bucketName)
      .getPublicUrl(data.path).data.publicUrl;

    return NextResponse.json({
      url: data.signedUrl,
      token: data.token,
      publicUrl,
      key: data.path,
    });
  } catch (err) {
    console.error("Failed to create upload URL", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
