"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getStarredDiagrams,
  starDiagram,
  unstarDiagram,
  isDiagramStarred,
} from "@/app/_actions";
import { Item } from "@/types";

// Query keys
export const starredKeys = {
  all: ["starred"] as const,
  lists: () => [...starredKeys.all, "list"] as const,
  list: () => [...starredKeys.lists()] as const,
  detail: (diagramId: string) =>
    [...starredKeys.all, "detail", diagramId] as const,
};

const ITEMS_PER_PAGE = 20;

/**
 * Hook to fetch starred diagrams with infinite query
 */
export const useStarredDiagrams = () => {
  const queryClient = useQueryClient();

  // Fetch starred diagrams with infinite query
  const query = useInfiniteQuery({
    queryKey: starredKeys.list(),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getStarredDiagrams({
        page: pageParam,
        limit: ITEMS_PER_PAGE,
      });
      return result ?? { diagrams: [], hasMore: false, total: 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  // Combine diagrams into items
  const items: Item[] = [];
  query.data?.pages.forEach((page) => {
    page.diagrams.forEach((diagram) => {
      items.push({
        type: "diagram",
        ...diagram,
      } as Item);
    });
  });

  // Star mutation
  const starMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      return await starDiagram(diagramId);
    },
    onSuccess: () => {
      // Invalidate starred list
      queryClient.invalidateQueries({ queryKey: starredKeys.list() });
      // Invalidate diagram starred status
      queryClient.invalidateQueries({ queryKey: starredKeys.all });
    },
  });

  // Unstar mutation
  const unstarMutation = useMutation({
    mutationFn: async (diagramId: string) => {
      return await unstarDiagram(diagramId);
    },
    onSuccess: () => {
      // Invalidate starred list
      queryClient.invalidateQueries({ queryKey: starredKeys.list() });
      // Invalidate diagram starred status
      queryClient.invalidateQueries({ queryKey: starredKeys.all });
    },
  });

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
    starDiagram: starMutation.mutateAsync,
    unstarDiagram: unstarMutation.mutateAsync,
    isStarring: starMutation.isPending,
    isUnstarring: unstarMutation.isPending,
  };
};

/**
 * Hook to check if a diagram is starred
 */
export const useIsDiagramStarred = (diagramId: string) => {
  const query = useQuery({
    queryKey: starredKeys.detail(diagramId),
    queryFn: async () => {
      return await isDiagramStarred(diagramId);
    },
    enabled: !!diagramId,
  });

  return {
    isStarred: query.data ?? false,
    isLoading: query.isLoading,
  };
};
