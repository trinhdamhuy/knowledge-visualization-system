"use server";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_ACCESS_SECRET!,
  },
});

type SignedURLResponse = Promise<
  { failure?: undefined; url: string } | { failure: string; url?: undefined }
>;

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

const computeSHA256 = async (file: File) => {
  const fileBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

async function uploadFileToS3(
  file: File,
  folder?: string
): Promise<SignedURLResponse> {
  const fileName = generateFileName(file.name);
  const key = folder ? `${folder}/${fileName}` : fileName;

  const checksum = await computeSHA256(file);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET!,
    Key: key,
    ContentType: file.type,
    ContentLength: file.size,
    ChecksumSHA256: checksum,
  });

  // get signed url for 1 minute
  const url = await getSignedUrl(s3Client, command, {
    expiresIn: 60,
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

  const result = await s3Client.send(command);
  return result.$metadata.httpStatusCode === 204;
}

async function deleteFilesFromS3(fileNames: string[]): Promise<boolean[]> {
  const results = await Promise.all(
    fileNames.map((fileName) => deleteFileFromS3(fileName))
  );
  return results;
}

export { uploadFileToS3, deleteFileFromS3, deleteFilesFromS3 };
