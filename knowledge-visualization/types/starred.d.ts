import type { DiagramWithRelations } from "./diagram";

/**
 * Parameters for getting starred diagrams
 */
export interface GetStarredDiagramsParams {
  page?: number;
  limit?: number;
}

/**
 * Result of getting starred diagrams
 */
export interface GetStarredDiagramsResult {
  diagrams: DiagramWithRelations[];
  hasMore: boolean;
  total: number;
}

