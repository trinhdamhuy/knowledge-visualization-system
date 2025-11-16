import { Folder, Share, Team, User } from "@prisma/client";

/**
 * Folder with all relations populated
 */
export type FullFolder = Folder & {
  team: Team | null;
  owner: Pick<User, "id" | "name" | "email" | "image">;
  shares: (Share & {
    user: Pick<User, "id" | "name" | "email" | "image">;
  })[];
  trash?: {
    id: string;
    deletedAt: Date;
    autoDeleteAt: Date;
  } | null;
};

/**
 * Folder with relations (used in actions)
 */
export type FolderWithRelations = Folder & {
  team: Team | null;
  owner: Pick<User, "id" | "name" | "email" | "image">;
  shares: (Share & {
    user: Pick<User, "id" | "name" | "email" | "image"> | null;
  })[];
};

/**
 * Sort options for folders
 */
export type FolderSortBy = "name" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

/**
 * Parameters for getting folders
 */
export interface GetFoldersParams {
  teamId?: string | null;
  parentId?: string | null;
  ownerId?: string | null;
  page?: number;
  limit?: number;
  sortBy?: FolderSortBy;
  sortDirection?: SortDirection;
}

/**
 * Result of getting folders
 */
export interface GetFoldersResult {
  folders: FolderWithRelations[];
  hasMore: boolean;
  total: number;
}
