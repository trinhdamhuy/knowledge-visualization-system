"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getSharedDiagrams } from "@/app/_actions";
import { Item } from "@/types";
import type { DiagramSortBy, SortDirection } from "@/types/diagram";

// Query keys
export const sharedKeys = {
  all: ["shared"] as const,
  lists: () => [...sharedKeys.all, "list"] as const,
  list: (sortBy?: DiagramSortBy | string, sortDirection?: SortDirection) =>
    [...sharedKeys.lists(), sortBy, sortDirection] as const,
};

const ITEMS_PER_PAGE = 20;

interface UseSharedDiagramsParams {
  sortBy?: DiagramSortBy | "sharedAt";
  sortDirection?: SortDirection;
}

/**
 * Hook to fetch shared diagrams with infinite query
 */
export const useSharedDiagrams = (params: UseSharedDiagramsParams = {}) => {
  const { sortBy = "updatedAt", sortDirection = "desc" } = params;

  // Fetch shared diagrams with infinite query
  const query = useInfiniteQuery({
    queryKey: sharedKeys.list(sortBy, sortDirection),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getSharedDiagrams({
        page: pageParam,
        limit: ITEMS_PER_PAGE,
        sortBy: sortBy === "sharedAt" ? "sharedAt" : (sortBy as DiagramSortBy),
        sortDirection,
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

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    refetch: query.refetch,
  };
};
