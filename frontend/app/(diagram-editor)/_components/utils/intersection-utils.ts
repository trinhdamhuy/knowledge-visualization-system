import { Node, Edge } from "@xyflow/react";

export interface BoxBounds {
  x: number;
  y: number;
}

/**
 * Check if a node intersects with a selection box (in flow coordinates)
 */
export function nodeIntersectsBox(
  node: Node,
  boxStart: BoxBounds,
  boxEnd: BoxBounds
): boolean {
  const nodeLeft = node.position.x;
  const nodeRight = node.position.x + (node.width || 150);
  const nodeTop = node.position.y;
  const nodeBottom = node.position.y + (node.height || 50);

  const boxLeft = Math.min(boxStart.x, boxEnd.x);
  const boxRight = Math.max(boxStart.x, boxEnd.x);
  const boxTop = Math.min(boxStart.y, boxEnd.y);
  const boxBottom = Math.max(boxStart.y, boxEnd.y);

  // Check intersection (partial overlap is enough)
  return !(
    nodeRight < boxLeft ||
    nodeLeft > boxRight ||
    nodeBottom < boxTop ||
    nodeTop > boxBottom
  );
}

/**
 * Check if an edge intersects with a selection box
 * Edge is selected if both endpoints are in the box
 */
export function edgeIntersectsBox(
  edge: Edge,
  boxStart: BoxBounds,
  boxEnd: BoxBounds,
  nodes: Node[]
): boolean {
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  if (!sourceNode || !targetNode) return false;

  return (
    nodeIntersectsBox(sourceNode, boxStart, boxEnd) &&
    nodeIntersectsBox(targetNode, boxStart, boxEnd)
  );
}

/**
 * Check if target element is a ReactFlow interactive element
 */
export function isReactFlowElement(target: HTMLElement): boolean {
  return !!(
    target.closest(".react-flow__node") ||
    target.closest(".react-flow__edge") ||
    target.closest(".react-flow__handle") ||
    target.closest(".react-flow__edge-path") ||
    target.closest(".react-flow__edge-text")
  );
}
