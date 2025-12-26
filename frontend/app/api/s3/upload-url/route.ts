import { NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client } from "@/lib/file-upload-handler";

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

export async function POST(request: Request) {
  try {
    const bucket = process.env.AWS_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return NextResponse.json(
        { error: "Missing AWS_BUCKET or AWS_REGION" },
        { status: 500 }
      );
    }

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
    const folder = body.folder?.trim();
    const key = folder ? `${folder}/${safeName}` : safeName;
    const contentType =
      body.fileType && body.fileType.trim().length > 0
        ? body.fileType
        : "application/octet-stream";

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(await getS3Client(), command, {
      expiresIn: 3600,
    });
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(
      key
    )}`;

    return NextResponse.json({ url, publicUrl, key });
  } catch (err) {
    console.error("Failed to create upload URL", err);
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    );
  }
}
