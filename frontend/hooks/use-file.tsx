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
  const { uploadFileHandler, uploadProgress, reset } = useUploadFile();

  // Query: Get files by diagram ID
  const useFilesByDiagram = (diagramId: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: fileKeys.byDiagram(diagramId),
      queryFn: async () => {
        const result = await getFilesByDiagramId(diagramId);
        return result;
      },
      enabled: enabled && !!diagramId,
      // File metadata rarely changes without an explicit user action (upload/delete),
      // so avoid refetches that can indirectly cause viewer reloads.
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: 30 * 60 * 1000, // keep in cache for 30m after last observer
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
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
      return await deleteFileByUrl(params.fileUrl);
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate files query for all diagrams (since we don't have diagramId here)
        queryClient.invalidateQueries({
          queryKey: fileKeys.all,
        });
        // Clear file store
        clearFile();
        reset();
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
    let fileType = "txt";
    if (fileExtension === "pdf") {
      fileType = "pdf";
    } else if (fileExtension === "md" || fileExtension === "markdown") {
      fileType = "md";
    } else if (fileExtension === "txt") {
      fileType = "txt";
    }

    // Create file record in database
    const result = await createFileMutation.mutateAsync({
      diagramId,
      fileName: file.name,
      fileUrl: uploadedUrl,
      fileType,
    });

    return result;
  };

  return {
    // State
    fileName,
    fileUrl,
    setFile,
    clearFile,
    uploadProgress,

    // Queries
    useFilesByDiagram,

    // Mutations
    uploadAndCreateFile,
    createFileMutation,
    deleteFileByUrlMutation,
  };
};
