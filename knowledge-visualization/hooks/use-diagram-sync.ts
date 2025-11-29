"use client";

import { useMemo } from "react";
import { useMutation, useStorage } from "@liveblocks/react";
import { LiveObject, LsonObject } from "@liveblocks/client";
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";

/**
 * Hook to sync React Flow with Liveblocks storage
 * Uses Liveblocks as single source of truth
 */
export function useDiagramSync() {
  // Get Liveblocks storage
  const nodesMap = useStorage((root) => root.nodes);
  const edgesMap = useStorage((root) => root.edges);

  // Convert LiveMap to arrays
  const nodes = useMemo(() => {
    if (!nodesMap) return [];
    return Array.from(nodesMap.values()).map((node) => {
      if (node && typeof node === "object" && "toObject" in node) {
        return (node as unknown as { toObject: () => Node }).toObject();
      }
      return node as unknown as Node;
    });
  }, [nodesMap]);

  const edges = useMemo(() => {
    if (!edgesMap) return [];
    return Array.from(edgesMap.values()).map((edge) => {
      if (edge && typeof edge === "object" && "toObject" in edge) {
        return (edge as unknown as { toObject: () => Edge }).toObject();
      }
      return edge as unknown as Edge;
    });
  }, [edgesMap]);

  // Mutation to update nodes in Liveblocks
  const updateNodes = useMutation(({ storage }, changes: NodeChange[]) => {
    const storageNodes = storage.get("nodes");
    if (!storageNodes) return;

    // Get current nodes from storage
    const currentNodes = Array.from(storageNodes.values()).map((node) => {
      if (node && typeof node === "object" && "toObject" in node) {
        return (node as unknown as { toObject: () => Node }).toObject();
      }
      return node as unknown as Node;
    });

    const updatedNodes = applyNodeChanges(changes, currentNodes);

    // Update or add nodes
    updatedNodes.forEach((node) => {
      storageNodes.set(node.id, new LiveObject(node as unknown as LsonObject));
    });

    // Remove deleted nodes
    const nodeIds = new Set(updatedNodes.map((n) => n.id));
    storageNodes.forEach((_, id) => {
      if (!nodeIds.has(id)) {
        storageNodes.delete(id);
      }
    });
  }, []);

  // Mutation to update edges in Liveblocks
  const updateEdges = useMutation(({ storage }, changes: EdgeChange[]) => {
    const storageEdges = storage.get("edges");
    if (!storageEdges) return;

    // Get current edges from storage
    const currentEdges = Array.from(storageEdges.values()).map((edge) => {
      if (edge && typeof edge === "object" && "toObject" in edge) {
        return (edge as unknown as { toObject: () => Edge }).toObject();
      }
      return edge as unknown as Edge;
    });

    const updatedEdges = applyEdgeChanges(changes, currentEdges);

    // Update or add edges
    updatedEdges.forEach((edge) => {
      storageEdges.set(edge.id, new LiveObject(edge as unknown as LsonObject));
    });

    // Remove deleted edges
    const edgeIds = new Set(updatedEdges.map((e) => e.id));
    storageEdges.forEach((_, id) => {
      if (!edgeIds.has(id)) {
        storageEdges.delete(id);
      }
    });
  }, []);

  // Mutation to add new edge on connect
  const addNewEdge = useMutation(({ storage }, connection: Connection) => {
    const storageEdges = storage.get("edges");
    if (!storageEdges) return;

    // Get current edges from storage
    const currentEdges = Array.from(storageEdges.values()).map((edge) => {
      if (edge && typeof edge === "object" && "toObject" in edge) {
        return (edge as unknown as { toObject: () => Edge }).toObject();
      }
      return edge as unknown as Edge;
    });

    const newEdges = addEdge(connection, currentEdges);

    // Update all edges
    newEdges.forEach((edge) => {
      storageEdges.set(edge.id, new LiveObject(edge as unknown as LsonObject));
    });
  }, []);

  // Mutation to add a new node
  const addNode = useMutation(({ storage }, newNode: Node) => {
    const storageNodes = storage.get("nodes");
    if (!storageNodes) return;

    storageNodes.set(
      newNode.id,
      new LiveObject(newNode as unknown as LsonObject)
    );
  }, []);

  const addNodeWithEdge = useMutation(
    ({ storage }, newNode: Node, newEdge: Edge) => {
      const storageNodes = storage.get("nodes");
      const storageEdges = storage.get("edges");
      if (!storageNodes || !storageEdges) return;

      storageNodes.set(
        newNode.id,
        new LiveObject(newNode as unknown as LsonObject)
      );
      storageEdges.set(
        newEdge.id,
        new LiveObject(newEdge as unknown as LsonObject)
      );
    },
    []
  );

  return {
    nodes,
    edges,
    updateNodes,
    updateEdges,
    addNewEdge,
    addNode,
    addNodeWithEdge,
  };
}
