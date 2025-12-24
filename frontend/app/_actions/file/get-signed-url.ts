"use server";

import { getSignedFileUrl } from "@/lib/file-upload-handler";

/**
 * Get a signed URL for reading a file from S3
 * @param fileUrl - The public S3 URL
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if failed
 */
export async function getSignedFileUrlAction(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string | null> {
  return await getSignedFileUrl(fileUrl, expiresIn);
}
