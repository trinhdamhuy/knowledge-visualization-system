import type { DiagramWithRelations } from "./diagram";

/**
 * Parameters for getting shared diagrams
 */
export interface GetSharedDiagramsParams {
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "sharedAt";
  sortDirection?: "asc" | "desc";
}

/**
 * Result of getting shared diagrams
 */
export interface GetSharedDiagramsResult {
  diagrams: DiagramWithRelations[];
  hasMore: boolean;
  total: number;
}
