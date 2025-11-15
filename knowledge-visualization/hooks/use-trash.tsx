"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTrashItems,
  restoreDiagram,
  restoreFolder,
  permanentDeleteDiagram,
  permanentDeleteFolder,
} from "@/app/_actions/trash";
import type { GetTrashItemsResult, TrashItem } from "@/types/trash";

// Query keys
export const trashKeys = {
  all: ["trash"] as const,
  lists: () => [...trashKeys.all, "list"] as const,
  list: () => [...trashKeys.lists()] as const,
};

const ITEMS_PER_PAGE = 20;

/**
 * Hook to fetch trash items with infinite query
 */
export const useTrashItems = () => {
  const query = useInfiniteQuery<GetTrashItemsResult>({
    queryKey: trashKeys.list(),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getTrashItems({
        page: pageParam,
        limit: ITEMS_PER_PAGE,
      });
      return result ?? { items: [], hasMore: false, total: 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const items: TrashItem[] =
    query.data?.pages.flatMap((page) => page.items) || [];

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
};

/**
 * Hook to restore items from trash
 */
export const useRestoreTrash = () => {
  const queryClient = useQueryClient();

  const restoreMutation = useMutation({
    mutationFn: async ({ item }: { item: TrashItem }) => {
      if (item.type === "diagram") {
        return await restoreDiagram(item.id);
      } else {
        return await restoreFolder(item.id);
      }
    },
    onSuccess: () => {
      // Invalidate trash list
      queryClient.invalidateQueries({ queryKey: trashKeys.list() });
      // Invalidate items list (for home, my-diagrams pages)
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  return {
    restore: restoreMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
  };
};

/**
 * Hook to permanently delete items from trash
 */
export const usePermanentDeleteTrash = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ item }: { item: TrashItem }) => {
      if (item.type === "diagram") {
        return await permanentDeleteDiagram(item.id);
      } else {
        return await permanentDeleteFolder(item.id);
      }
    },
    onSuccess: () => {
      // Invalidate trash list
      queryClient.invalidateQueries({ queryKey: trashKeys.list() });
    },
  });

  return {
    permanentDelete: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

