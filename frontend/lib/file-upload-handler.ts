"use server";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

type SignedURLResponse = Promise<
  { failure?: undefined; url: string } | { failure: string; url?: undefined }
>;

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

const generateFileName = (fileName: string) => {
  const now = new Date();
  const timestamp = now.getTime();

  // Get the actual file extension from the original filename
  const lastDotIndex = fileName.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < fileName.length - 1;
  const fileExtension = hasExtension
    ? fileName.substring(lastDotIndex + 1).toLowerCase()
    : "";

  // Get the base name without extension
  const baseName = hasExtension
    ? fileName.substring(0, lastDotIndex)
    : fileName;

  // Sanitize filename: remove special characters and replace spaces with underscores
  const sanitizedBaseName = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 100); // Limit length

  // Return original filename with timestamp to avoid duplicates
  return hasExtension
    ? `${sanitizedBaseName}_${timestamp}.${fileExtension}`
    : `${sanitizedBaseName}_${timestamp}`;
};

async function uploadFileToS3(
  file: File,
  folder?: string
): Promise<SignedURLResponse> {
  const fileName = generateFileName(file.name);
  const key = folder ? `${folder}/${fileName}` : fileName;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET!,
    Key: key,
    ContentType:
      file.type && file.type.trim().length > 0
        ? file.type
        : "application/octet-stream",
  });

  // get signed url for 1 hour
  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: 3600,
  });

  return { url };
}

async function deleteFileFromS3(fileName: string): Promise<boolean> {
  // Use proper URL parsing instead of string replacement to prevent exploitation
  let s3Key: string;

  try {
    if (fileName.startsWith("https://")) {
      const url = new URL(fileName);
      // Extract the pathname and remove the leading slash
      s3Key = url.pathname.substring(1);

      // Validate that this is actually an S3 URL from our bucket
      const expectedHostname = `${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      if (url.hostname !== expectedHostname) {
        console.error(
          `Invalid S3 hostname: ${url.hostname}, expected: ${expectedHostname}`
        );
        return false;
      }
    } else return false;
  } catch (error) {
    console.error(`Failed to parse S3 URL: ${fileName}`, error);
    return false;
  }

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: s3Key,
  });

  const result = await getS3Client().send(command);
  return result.$metadata.httpStatusCode === 204;
}

async function deleteFilesFromS3(fileNames: string[]): Promise<boolean[]> {
  const results = await Promise.all(
    fileNames.map((fileName) => deleteFileFromS3(fileName))
  );
  return results;
}

/**
 * Generate a signed URL for reading a file from S3
 * @param fileUrl - The public S3 URL or S3 key
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if failed
 */
async function getSignedFileUrl(
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    let s3Key: string;

    if (fileUrl.startsWith("https://")) {
      const url = new URL(fileUrl);
      s3Key = url.pathname.substring(1);

      // Validate hostname
      const expectedHostname = `${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      if (url.hostname !== expectedHostname) {
        console.error(
          `Invalid S3 hostname: ${url.hostname}, expected: ${expectedHostname}`
        );
        return null;
      }
    } else {
      s3Key = fileUrl;
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET!,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(getS3Client(), command, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error("Failed to generate signed URL:", error);
    return null;
  }
}

export {
  uploadFileToS3,
  deleteFileFromS3,
  deleteFilesFromS3,
  getSignedFileUrl,
};
