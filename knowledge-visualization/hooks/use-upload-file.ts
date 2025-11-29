"use client";

import { useState } from "react";
import { uploadFileToS3, deleteFileFromS3 } from "@/lib/file-upload-handler";
import { Response } from "@/types";

interface UseUploadFileResult {
  uploadFileHandler: (file: File, folder?: string) => Promise<string | null>;
  deleteFileHandler: (url: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useUploadFile(): UseUploadFileResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    await fetch(fileUrl.url, {
      method: "PUT",
      body: file,
    });
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
      let message = "Upload failed";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "string") {
        message = err;
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
    }
  };

  const reset = () => {
    setError(null);
    setLoading(false);
  };

  return {
    uploadFileHandler,
    deleteFileHandler,
    loading,
    error,
    reset,
  };
}
