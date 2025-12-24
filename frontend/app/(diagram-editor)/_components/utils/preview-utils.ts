import type { Node, Edge } from "@xyflow/react";
import type {
  PreviewNode,
  PreviewEdge,
  DiagramPreview,
} from "@/app/_actions/diagram/update-preview";

const MAX_PREVIEW_NODES = 300;
const MAX_PREVIEW_EDGES = 500;

/**
 * Convert ReactFlow nodes and edges to minimal preview payload
 * Only includes essential data: position, size, shape for nodes; source/target for edges
 */
export function toPreviewPayload(nodes: Node[], edges: Edge[]): DiagramPreview {
  // Limit nodes/edges to prevent oversized previews
  const limitedNodes = nodes.slice(0, MAX_PREVIEW_NODES);
  const limitedEdges = edges.slice(0, MAX_PREVIEW_EDGES);

  const previewNodes: PreviewNode[] = limitedNodes.map((node) => {
    // Get width/height with fallbacks
    const w = node.width ?? (node.measured?.width as number | undefined) ?? 150;
    const h =
      node.height ?? (node.measured?.height as number | undefined) ?? 50;

    // Get shape from node.data.shape, default to "rectangle"
    const shape = ((node.data?.shape as string | undefined) || "rectangle") as
      | "rectangle"
      | "square"
      | "circle"
      | "diamond";

    return {
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      w,
      h,
      shape,
    };
  });

  const previewEdges: PreviewEdge[] = limitedEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));

  return {
    nodes: previewNodes,
    edges: previewEdges,
  };
}
