import { Diagram, Share, Team, User } from "@prisma/client";

/**
 * Diagram with all relations populated
 */
export type FullDiagram = Diagram & {
  team: Team | null;
  owner: Pick<User, "id" | "name" | "email" | "image"> | null;
  shares: (Share & {
    user: Pick<User, "id" | "name" | "email" | "image"> | null;
  })[];
  starreds?: {
    userId: string;
  }[];
};

/**
 * Diagram with relations (used in actions)
 */
export type DiagramWithRelations = Diagram & {
  team: Team | null;
  owner: Pick<User, "id" | "name" | "email" | "image"> | null;
  shares: (Share & {
    user: Pick<User, "id" | "name" | "email" | "image"> | null;
  })[];
  starreds?: {
    userId: string;
  }[];
};

/**
 * Sort options for diagrams
 */
export type DiagramSortBy = "name" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

/**
 * Parameters for getting diagrams
 */
export interface GetDiagramsParams {
  teamId?: string | null;
  folderId?: string | null;
  ownerId?: string | null;
  page?: number;
  limit?: number;
  sortBy?: DiagramSortBy;
  sortDirection?: SortDirection;
}

/**
 * Result of getting diagrams
 */
export interface GetDiagramsResult {
  diagrams: DiagramWithRelations[];
  hasMore: boolean;
  total: number;
}
