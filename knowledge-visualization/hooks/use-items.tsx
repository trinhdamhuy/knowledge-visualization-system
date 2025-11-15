"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getFolders, getDiagrams } from "@/app/_actions";
import { Item } from "@/types";
import type { DiagramSortBy, SortDirection, FolderSortBy } from "@/types";

// Query keys
export const itemsKeys = {
  all: ["items"] as const,
  lists: () => [...itemsKeys.all, "list"] as const,
  list: (teamId: string | null, parentId: string | null) =>
    [...itemsKeys.lists(), { teamId, parentId }] as const,
};

interface UseItemsParams {
  parentId?: string | null;
  enabled?: boolean;
  onlyMine?: boolean; // If true, only show items owned by current user (for my-diagrams)
  sortBy?: DiagramSortBy | FolderSortBy;
  sortDirection?: SortDirection;
}

const ITEMS_PER_PAGE = 20;

/**
 * Hook to fetch folders and diagrams with infinite query
 * Folders are displayed before diagrams
 */
export const useItems = (params: UseItemsParams = {}) => {
  const {
    parentId = null,
    enabled = true,
    onlyMine = false,
    sortBy = "updatedAt",
    sortDirection = "desc",
  } = params;

  // Fetch folders with infinite query
  const foldersQuery = useInfiniteQuery({
    queryKey: [
      ...itemsKeys.list(onlyMine ? "mine" : "all", parentId),
      "folders",
      onlyMine ? "mine" : "all",
      sortBy,
      sortDirection,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getFolders({
        parentId: parentId,
        ownerId: onlyMine ? "current" : null, // "current" will be replaced with actual userId in server action
        page: pageParam,
        limit: ITEMS_PER_PAGE,
        sortBy: sortBy === "title" ? "name" : (sortBy as FolderSortBy),
        sortDirection,
      });
      return result ?? { folders: [], hasMore: false, total: 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    enabled: enabled,
  });

  // Fetch diagrams with infinite query
  const diagramsQuery = useInfiniteQuery({
    queryKey: [
      ...itemsKeys.list(onlyMine ? "mine" : "all", parentId),
      "diagrams",
      onlyMine ? "mine" : "all",
      sortBy,
      sortDirection,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getDiagrams({
        folderId: parentId,
        ownerId: onlyMine ? "current" : null, // "current" will be replaced with actual userId in server action
        page: pageParam,
        limit: ITEMS_PER_PAGE,
        sortBy: sortBy === "name" ? "title" : (sortBy as DiagramSortBy),
        sortDirection,
      });
      return result ?? { diagrams: [], hasMore: false, total: 0 };
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    enabled: enabled,
  });

  // Combine folders and diagrams with folders first
  const items: Item[] = [];

  // Add all folders first
  foldersQuery.data?.pages.forEach((page) => {
    page.folders.forEach((folder) => {
      items.push({
        type: "folder",
        ...folder,
      } as Item);
    });
  });

  // Then add all diagrams
  diagramsQuery.data?.pages.forEach((page) => {
    page.diagrams.forEach((diagram) => {
      items.push({
        type: "diagram",
        ...diagram,
      } as Item);
    });
  });

  // Check if there are more items to load
  const hasNextPage =
    (foldersQuery.hasNextPage || diagramsQuery.hasNextPage) ?? false;

  // Load next page (loads both folders and diagrams)
  const fetchNextPage = () => {
    if (foldersQuery.hasNextPage) {
      foldersQuery.fetchNextPage();
    }
    if (diagramsQuery.hasNextPage) {
      diagramsQuery.fetchNextPage();
    }
  };

  return {
    items,
    isLoading: foldersQuery.isLoading || diagramsQuery.isLoading,
    isFetching: foldersQuery.isFetching || diagramsQuery.isFetching,
    isFetchingNextPage:
      foldersQuery.isFetchingNextPage || diagramsQuery.isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: foldersQuery.error || diagramsQuery.error,
    refetch: () => {
      foldersQuery.refetch();
      diagramsQuery.refetch();
    },
  };
};
