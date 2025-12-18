"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChatHistory,
  deleteChatHistory,
  deleteDiagramStore,
  sendChatRequest,
} from "@/app/_actions/chat";
import type { ChatRequest } from "@/types/chat";

// Query keys
export const chatKeys = {
  all: ["chat"] as const,
  histories: () => [...chatKeys.all, "history"] as const,
  history: (diagramId: string) => [...chatKeys.histories(), diagramId] as const,
};

interface SendChatRequestParams extends ChatRequest {}

interface DeleteChatHistoryParams {
  diagramId: string;
}

interface DeleteDiagramStoreParams {
  diagramId: string;
}

export const useChat = () => {
  const queryClient = useQueryClient();

  // Query: Get chat history
  const useChatHistory = (diagramId: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: chatKeys.history(diagramId),
      queryFn: async () => {
        const result = await getChatHistory(diagramId);
        return result;
      },
      enabled: enabled && !!diagramId,
    });
  };

  // Mutation: Send chat request
  const sendChatRequestMutation = useMutation({
    mutationFn: async (params: SendChatRequestParams) => {
      return await sendChatRequest(params);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Wait a bit to ensure backend has saved the message to database
        // then invalidate chat history for this diagram
        setTimeout(() => {
          queryClient.invalidateQueries({
            queryKey: chatKeys.history(variables.diagram_id),
          });
        }, 300);
      }
    },
  });

  // Mutation: Delete chat history
  const deleteChatHistoryMutation = useMutation({
    mutationFn: async (params: DeleteChatHistoryParams) => {
      return await deleteChatHistory(params.diagramId);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate chat history for this diagram
        queryClient.invalidateQueries({
          queryKey: chatKeys.history(variables.diagramId),
        });
      }
    },
  });

  // Mutation: Delete diagram store
  const deleteDiagramStoreMutation = useMutation({
    mutationFn: async (params: DeleteDiagramStoreParams) => {
      return await deleteDiagramStore(params.diagramId);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate chat history for this diagram
        queryClient.invalidateQueries({
          queryKey: chatKeys.history(variables.diagramId),
        });
      }
    },
  });

  return {
    // Query hooks
    useChatHistory,

    // Mutations
    sendChatRequest: sendChatRequestMutation.mutateAsync,
    sendChatRequestMutation,
    deleteChatHistory: deleteChatHistoryMutation.mutateAsync,
    deleteChatHistoryMutation,
    deleteDiagramStore: deleteDiagramStoreMutation.mutateAsync,
    deleteDiagramStoreMutation,
  };
};
