import type { FullDiagram } from "./diagram";
import type { FullFolder } from "./folder";

/**
 * Union type for items that can be displayed in the list
 */
export type Item =
  | ({ type: "folder" } & FullFolder)
  | ({ type: "diagram" } & FullDiagram);
