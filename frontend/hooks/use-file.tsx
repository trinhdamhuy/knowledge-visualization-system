"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFilesByDiagramId,
  createFile,
  deleteFileByUrl,
} from "@/app/_actions/file";
import { useFileStore } from "@/stores/file-store";
import { useUploadFile } from "@/hooks/use-upload-file";
import type { File as PrismaFile } from "@/generated/prisma/client";

// Query keys
export const fileKeys = {
  all: ["files"] as const,
  byDiagram: (diagramId: string) =>
    [...fileKeys.all, "diagram", diagramId] as const,
};

interface CreateFileParams {
  diagramId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface DeleteFileByUrlParams {
  fileUrl: string;
}

export const useFile = () => {
  const queryClient = useQueryClient();
  const { fileName, fileUrl, setFile, clearFile } = useFileStore();
  const { uploadFileHandler, deleteFileHandler } = useUploadFile();

  // Query: Get files by diagram ID
  const useFilesByDiagram = (diagramId: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: fileKeys.byDiagram(diagramId),
      queryFn: async () => {
        const result = await getFilesByDiagramId(diagramId);
        return result;
      },
      enabled: enabled && !!diagramId,
      select: (data) => {
        // Return the latest file if available
        if (data && data.length > 0) {
          return data[0];
        }
        return null;
      },
    });
  };

  // Mutation: Create file
  const createFileMutation = useMutation({
    mutationFn: async (params: CreateFileParams) => {
      return await createFile(
        params.diagramId,
        params.fileName,
        params.fileUrl,
        params.fileType
      );
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate files query
        queryClient.invalidateQueries({
          queryKey: fileKeys.byDiagram(variables.diagramId),
        });
        // Update file store
        setFile(data.fileName, data.fileUrl);
      }
    },
  });

  // Mutation: Delete file by URL
  const deleteFileByUrlMutation = useMutation({
    mutationFn: async (params: DeleteFileByUrlParams) => {
      // Delete from S3 first
      await deleteFileHandler(params.fileUrl);
      // Then delete from database
      return await deleteFileByUrl(params.fileUrl);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate files query for all diagrams (since we don't have diagramId here)
        queryClient.invalidateQueries({
          queryKey: fileKeys.all,
        });
        // Clear file store
        clearFile();
      }
    },
  });

  // Combined: Upload and create file
  const uploadAndCreateFile = async (
    file: globalThis.File,
    diagramId: string,
    folder?: string
  ): Promise<PrismaFile | null> => {
    // Upload to S3
    const uploadedUrl = await uploadFileHandler(file, folder);
    if (!uploadedUrl) {
      return null;
    }

    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const fileType = fileExtension === "pdf" ? "pdf" : "txt";

    // Create file record in database
    const result = await createFileMutation.mutateAsync({
      diagramId,
      fileName: file.name,
      fileUrl: uploadedUrl,
      fileType,
    });

    return result;
  };

  // Combined: Delete file (S3 + database)
  const deleteFile = async (
    fileUrl: string,
    diagramId?: string
  ): Promise<boolean> => {
    const result = await deleteFileByUrlMutation.mutateAsync({ fileUrl });

    // If we have diagramId, invalidate that specific query
    if (diagramId && result) {
      queryClient.invalidateQueries({
        queryKey: fileKeys.byDiagram(diagramId),
      });
    }

    return result;
  };

  return {
    // State
    fileName,
    fileUrl,
    setFile,
    clearFile,

    // Queries
    useFilesByDiagram,

    // Mutations
    uploadAndCreateFile,
    deleteFile,
    createFileMutation,
    deleteFileByUrlMutation,
  };
};
