import type { DiagramWithRelations } from "./diagram";
import type { FolderWithRelations } from "./folder";

/**
 * Trash item with relations
 */
export type TrashItem =
  | ({ type: "diagram" } & DiagramWithRelations & {
        trash: {
          id: string;
          deletedAt: Date;
          autoDeleteAt: Date;
        };
      })
  | ({ type: "folder" } & FolderWithRelations & {
        trash: {
          id: string;
          deletedAt: Date;
          autoDeleteAt: Date;
        };
      });

/**
 * Parameters for getting trash items
 */
export interface GetTrashItemsParams {
  page?: number;
  limit?: number;
  sortBy?: "deletedAt" | "createdAt" | "updatedAt" | "title";
  sortDirection?: "asc" | "desc";
}

/**
 * Result of getting trash items
 */
export interface GetTrashItemsResult {
  items: TrashItem[];
  hasMore: boolean;
  total: number;
}
