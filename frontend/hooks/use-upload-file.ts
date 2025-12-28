"use client";

import { useState } from "react";
import { Response } from "@/types";

interface UseUploadFileResult {
  uploadFileHandler: (file: File, folder?: string) => Promise<string | null>;
  loading: boolean;
  uploadProgress: number;
  error: string | null;
  reset: () => void;
}

export function useUploadFile(): UseUploadFileResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  async function uploadFile(
    file: File,
    folder?: string
  ): Promise<Response<string | null>> {
    const presignRes = await fetch("/api/s3/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder,
      }),
    });

    if (!presignRes.ok) {
      const text = await presignRes.text().catch(() => "");
      return {
        success: false,
        error: text
          ? `Failed to create upload URL: ${presignRes.status} ${
              presignRes.statusText
            } - ${text.substring(0, 500)}`
          : `Failed to create upload URL: ${presignRes.status} ${presignRes.statusText}`,
      };
    }

    const fileUrl = (await presignRes.json()) as {
      url: string;
      publicUrl: string;
      key?: string;
    };

    if (!fileUrl?.url || !fileUrl?.publicUrl) {
      return { success: false, error: "Invalid upload URL response" };
    }

    // Use XMLHttpRequest to track upload progress
    setUploadProgress(0);

    const response = await new Promise<{
      ok: boolean;
      status: number;
      statusText: string;
      responseText: string;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", fileUrl.url, true);
      xhr.setRequestHeader(
        "Content-Type",
        file.type && file.type.trim().length > 0
          ? file.type
          : "application/octet-stream"
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          responseText: xhr.responseText,
        });
      };

      xhr.onerror = () => {
        reject(new Error("Network error during file upload"));
      };

      xhr.send(file);
    });

    if (!response.ok) {
      // Get error details from response
      const status = response.status;
      const statusText = response.statusText;
      const errorText = response.responseText || "";

      // Log detailed error information
      console.error("=== Upload Error Details ===");
      console.error("Status:", status);
      console.error("Status Text:", statusText);
      console.error("Response Body:", errorText);
      console.error("File Name:", file.name);
      console.error("File Size:", file.size);
      console.error("File Type:", file.type);
      console.error("Signed URL:", fileUrl.url);

      // Note: Response headers are not available via XHR in a simple way here

      const errorMessage = errorText
        ? `Upload failed: ${status} ${statusText} - ${errorText.substring(
            0,
            500
          )}`
        : `Upload failed: ${status} ${statusText}`;

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Ensure progress bar reaches 100% on success
    setUploadProgress(100);

    return { success: true, data: fileUrl.publicUrl };
  }

  const uploadFileHandler = async (
    file: File,
    folder?: string
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await uploadFile(file, folder);
      if (response.success) {
        return response.data || null;
      } else {
        setError(response.error || "Upload failed");
        return null;
      }
    } catch (err: unknown) {
      console.error("=== Upload Exception ===");
      console.error("Error:", err);
      console.error("Error Type:", typeof err);
      if (err instanceof Error) {
        console.error("Error Message:", err.message);
        console.error("Error Stack:", err.stack);
      }

      let message = "Upload failed";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      } else {
        message = JSON.stringify(err);
      }
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setLoading(false);
    setUploadProgress(0);
  };

  return {
    uploadFileHandler,
    loading,
    uploadProgress,
    error,
    reset,
  };
}
