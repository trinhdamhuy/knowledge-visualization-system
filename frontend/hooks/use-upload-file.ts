"use client";

import { useState } from "react";
import { uploadFileToS3, deleteFileFromS3 } from "@/lib/file-upload-handler";
import { Response } from "@/types";

interface UseUploadFileResult {
  uploadFileHandler: (file: File, folder?: string) => Promise<string | null>;
  deleteFileHandler: (url: string) => Promise<void>;
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
    const fileUrl = await uploadFileToS3(file, folder);
    if (fileUrl.failure || !fileUrl.url) {
      return {
        success: false,
        error: fileUrl.failure || "Failed to upload file",
      };
    }
    const imageUrl = fileUrl.url.split("?")[0];

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

    return { success: true, data: imageUrl };
  }

  async function deleteFile(fileUrl: string): Promise<Response<null>> {
    const success = await deleteFileFromS3(fileUrl);
    if (!success) {
      return { success: false, error: "Failed to delete file" };
    }
    return { success };
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

  const deleteFileHandler = async (fileUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await deleteFile(fileUrl);
      if (response.success) {
      } else {
        setError(response.error || "Delete failed");
      }
    } catch (err: unknown) {
      let message = "Delete failed";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
      }
      setError(message);
    } finally {
      setLoading(false);
      // Reset upload progress when deleting file
      setUploadProgress(0);
    }
  };

  const reset = () => {
    setError(null);
    setLoading(false);
    setUploadProgress(0);
  };

  return {
    uploadFileHandler,
    deleteFileHandler,
    loading,
    uploadProgress,
    error,
    reset,
  };
}
