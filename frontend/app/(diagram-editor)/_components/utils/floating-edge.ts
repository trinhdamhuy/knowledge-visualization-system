import { Position } from "@xyflow/react";
import type { InternalNode } from "@xyflow/react";

type HandleType = "source" | "target";

function getNodeCenter(node: InternalNode) {
  const w = node.measured?.width ?? 0;
  const h = node.measured?.height ?? 0;
  return {
    x: node.internals.positionAbsolute.x + w / 2,
    y: node.internals.positionAbsolute.y + h / 2,
  };
}

function getHandleCoordsByPosition(
  node: InternalNode,
  handlePosition: Position,
  handleType: HandleType
): [number, number] {
  const bounds = node.internals.handleBounds?.[handleType];
  if (!bounds || bounds.length === 0) {
    // Fallback to node center if handles are missing
    const c = getNodeCenter(node);
    return [c.x, c.y];
  }

  // Find a handle on the requested side
  const handle = bounds.find((h) => h.position === handlePosition) ?? bounds[0];

  let offsetX = handle.width / 2;
  let offsetY = handle.height / 2;

  // Adjust for handle origin (top-left)
  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle.width;
      break;
    case Position.Top:
      offsetY = 0;
      break;
    case Position.Bottom:
      offsetY = handle.height;
      break;
  }

  const x = node.internals.positionAbsolute.x + handle.x + offsetX;
  const y = node.internals.positionAbsolute.y + handle.y + offsetY;

  return [x, y];
}

// returns the position (top,right,bottom,left) passed node compared to another node
function getParams(
  nodeA: InternalNode,
  nodeB: InternalNode,
  handleType: HandleType
): [number, number, Position] {
  const centerA = getNodeCenter(nodeA);
  const centerB = getNodeCenter(nodeB);

  const horizontalDiff = Math.abs(centerA.x - centerB.x);
  const verticalDiff = Math.abs(centerA.y - centerB.y);

  let position: Position;

  // when the horizontal difference between the nodes is bigger, use Left/Right
  if (horizontalDiff > verticalDiff) {
    position = centerA.x > centerB.x ? Position.Left : Position.Right;
  } else {
    // otherwise use Top/Bottom
    position = centerA.y > centerB.y ? Position.Top : Position.Bottom;
  }

  const [x, y] = getHandleCoordsByPosition(nodeA, position, handleType);
  return [x, y, position];
}

// returns the parameters you need to create an edge path
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const [sx, sy, sourcePos] = getParams(source, target, "source");
  const [tx, ty, targetPos] = getParams(target, source, "target");

  return {
    sx,
    sy,
    tx,
    ty,
    sourcePos,
    targetPos,
  };
}
