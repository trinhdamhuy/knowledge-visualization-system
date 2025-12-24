import type { Edge, Node } from "@xyflow/react";

type NodeDataWithCollapsed = { collapsed?: boolean } | undefined | null;

function isCollapsed(node: Node): boolean {
  const data = node.data as NodeDataWithCollapsed;
  return Boolean(data?.collapsed);
}

function buildChildrenMap(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    const arr = map.get(e.source);
    if (arr) arr.push(e.target);
    else map.set(e.source, [e.target]);
  }
  return map;
}

/**
 * Returns all descendant node ids (children, grandchildren, ...) of `rootNodeId`.
 * Does NOT include `rootNodeId` itself.
 */
export function getDescendantNodeIds(
  rootNodeId: string,
  edges: Edge[]
): Set<string> {
  const childrenMap = buildChildrenMap(edges);
  const result = new Set<string>();
  const stack = [...(childrenMap.get(rootNodeId) ?? [])];

  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    const children = childrenMap.get(id);
    if (children?.length) stack.push(...children);
  }

  return result;
}

/**
 * Computes which nodes should be hidden, based on nodes that have `data.collapsed === true`.
 * Rule: if a node is collapsed, all of its descendants are hidden.
 * Default (no flag / false): expanded.
 */
export function computeHiddenNodeIds(
  nodes: Node[],
  edges: Edge[]
): Set<string> {
  const childrenMap = buildChildrenMap(edges);
  const hidden = new Set<string>();
  const collapsedRoots = nodes.filter(isCollapsed).map((n) => n.id);

  for (const rootId of collapsedRoots) {
    const stack = [...(childrenMap.get(rootId) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (hidden.has(id)) continue;
      hidden.add(id);
      const children = childrenMap.get(id);
      if (children?.length) stack.push(...children);
    }
  }

  return hidden;
}
