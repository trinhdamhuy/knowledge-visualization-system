"use client";

import { useMemo, useCallback } from "react";
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
import { useDiagramStore } from "@/app/(diagram-editor)/_stores/use-diagram-store";

/**
 * Helper function to remove selected prop from node (we use Presence for selection)
 */
function removeSelectedFromNode<T extends Node>(node: T): Omit<T, "selected"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { selected, ...nodeWithoutSelected } = node;
  return nodeWithoutSelected as Omit<T, "selected">;
}

/**
 * Helper function to remove selected prop from edge (we use Presence for selection)
 */
function removeSelectedFromEdge<T extends Edge>(edge: T): Omit<T, "selected"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { selected, ...edgeWithoutSelected } = edge;
  return edgeWithoutSelected as Omit<T, "selected">;
}

/**
 * Hook to sync React Flow with Liveblocks storage
 * Uses Liveblocks as single source of truth
 * Supports batch operations for better undo/redo
 */
export function useDiagramSync() {
  // Get Liveblocks storage
  const nodesMap = useStorage((root) => root.nodes);
  const edgesMap = useStorage((root) => root.edges);

  // Convert LiveMap to arrays and remove selected prop (we use Presence for selection)
  const nodes = useMemo(() => {
    if (!nodesMap) return [];
    return Array.from(nodesMap.values()).map((node) => {
      let nodeObj: Node;
      if (node && typeof node === "object" && "toObject" in node) {
        nodeObj = (node as unknown as { toObject: () => Node }).toObject();
      } else {
        nodeObj = node as unknown as Node;
      }
      // Remove selected prop - we use Presence for selection
      return removeSelectedFromNode(nodeObj);
    });
  }, [nodesMap]);

  const edges = useMemo(() => {
    if (!edgesMap) return [];
    return Array.from(edgesMap.values()).map((edge) => {
      let edgeObj: Edge;
      if (edge && typeof edge === "object" && "toObject" in edge) {
        edgeObj = (edge as unknown as { toObject: () => Edge }).toObject();
      } else {
        edgeObj = edge as unknown as Edge;
      }
      // Remove selected prop - we use Presence for selection
      return removeSelectedFromEdge(edgeObj);
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

    // Update or add nodes (remove selected prop - we use Presence for selection)
    updatedNodes.forEach((node) => {
      const nodeWithoutSelected = removeSelectedFromNode(node);
      storageNodes.set(
        node.id,
        new LiveObject(nodeWithoutSelected as unknown as LsonObject)
      );
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

    // Update or add edges (remove selected prop - we use Presence for selection)
    updatedEdges.forEach((edge) => {
      const edgeWithoutSelected = removeSelectedFromEdge(edge);
      storageEdges.set(
        edge.id,
        new LiveObject(edgeWithoutSelected as unknown as LsonObject)
      );
    });

    // Remove deleted edges
    const edgeIds = new Set(updatedEdges.map((e) => e.id));
    storageEdges.forEach((_, id) => {
      if (!edgeIds.has(id)) {
        storageEdges.delete(id);
      }
    });
  }, []);

  // Batch update nodes - groups all changes into single operation
  const batchUpdateNodes = useMutation(({ storage }, changes: NodeChange[]) => {
    const storageNodes = storage.get("nodes");
    if (!storageNodes) return;

    const currentNodes = Array.from(storageNodes.values()).map((node) => {
      if (node && typeof node === "object" && "toObject" in node) {
        return (node as unknown as { toObject: () => Node }).toObject();
      }
      return node as unknown as Node;
    });

    const updatedNodes = applyNodeChanges(changes, currentNodes);

    updatedNodes.forEach((node) => {
      const nodeWithoutSelected = removeSelectedFromNode(node);
      storageNodes.set(
        node.id,
        new LiveObject(nodeWithoutSelected as unknown as LsonObject)
      );
    });

    const nodeIds = new Set(updatedNodes.map((n) => n.id));
    storageNodes.forEach((_, id) => {
      if (!nodeIds.has(id)) {
        storageNodes.delete(id);
      }
    });
  }, []);

  // Batch update edges - groups all changes into single operation
  const batchUpdateEdges = useMutation(({ storage }, changes: EdgeChange[]) => {
    const storageEdges = storage.get("edges");
    if (!storageEdges) return;

    const currentEdges = Array.from(storageEdges.values()).map((edge) => {
      if (edge && typeof edge === "object" && "toObject" in edge) {
        return (edge as unknown as { toObject: () => Edge }).toObject();
      }
      return edge as unknown as Edge;
    });

    const updatedEdges = applyEdgeChanges(changes, currentEdges);

    updatedEdges.forEach((edge) => {
      const edgeWithoutSelected = removeSelectedFromEdge(edge);
      storageEdges.set(
        edge.id,
        new LiveObject(edgeWithoutSelected as unknown as LsonObject)
      );
    });

    const edgeIds = new Set(updatedEdges.map((e) => e.id));
    storageEdges.forEach((_, id) => {
      if (!edgeIds.has(id)) {
        storageEdges.delete(id);
      }
    });
  }, []);

  // Batch delete nodes and edges in a single operation (for undo/redo)
  // This ensures that deleting nodes and their connected edges creates only one undo entry
  const deleteNodesAndEdges = useMutation(
    (
      { storage },
      {
        nodeIds,
        edgeIds,
      }: {
        nodeIds: string[];
        edgeIds: string[];
      }
    ) => {
      const storageNodes = storage.get("nodes");
      const storageEdges = storage.get("edges");
      if (!storageNodes || !storageEdges) return;

      // Delete nodes
      nodeIds.forEach((id) => {
        storageNodes.delete(id);
      });

      // Delete edges
      edgeIds.forEach((id) => {
        storageEdges.delete(id);
      });
    },
    []
  );

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

    // Update all edges (remove selected prop - we use Presence for selection)
    newEdges.forEach((edge) => {
      const edgeWithoutSelected = removeSelectedFromEdge(edge);
      storageEdges.set(
        edge.id,
        new LiveObject(edgeWithoutSelected as unknown as LsonObject)
      );
    });
  }, []);

  // Mutation to add a new node
  const addNode = useMutation(({ storage }, newNode: Node) => {
    const storageNodes = storage.get("nodes");
    if (!storageNodes) return;

    // Remove selected prop - we use Presence for selection
    const nodeWithoutSelected = removeSelectedFromNode(newNode);
    storageNodes.set(
      newNode.id,
      new LiveObject(nodeWithoutSelected as unknown as LsonObject)
    );
  }, []);

  const addNodeWithEdge = useMutation(
    ({ storage }, newNode: Node, newEdge: Edge) => {
      const storageNodes = storage.get("nodes");
      const storageEdges = storage.get("edges");
      if (!storageNodes || !storageEdges) return;

      // Remove selected prop - we use Presence for selection
      const nodeWithoutSelected = removeSelectedFromNode(newNode);
      const edgeWithoutSelected = removeSelectedFromEdge(newEdge);
      storageNodes.set(
        newNode.id,
        new LiveObject(nodeWithoutSelected as unknown as LsonObject)
      );
      storageEdges.set(
        newEdge.id,
        new LiveObject(edgeWithoutSelected as unknown as LsonObject)
      );
    },
    []
  );

  // Batch update node data - for PropertiesPanel
  const batchUpdateNodeData = useMutation(
    (
      { storage },
      nodeIds: string[],
      data: Record<string, unknown>,
      nodeProps?: { width?: number; height?: number }
    ) => {
      const storageNodes = storage.get("nodes");
      if (!storageNodes) return;

      nodeIds.forEach((nodeId) => {
        const nodeObj = storageNodes.get(nodeId);
        if (!nodeObj) return;

        const currentNode =
          nodeObj && typeof nodeObj === "object" && "toObject" in nodeObj
            ? (nodeObj as unknown as { toObject: () => Node }).toObject()
            : (nodeObj as unknown as Node);

        const updatedNode: Node = {
          ...currentNode,
          width: nodeProps?.width ?? currentNode.width,
          height: nodeProps?.height ?? currentNode.height,
          measured: {
            width: nodeProps?.width ?? currentNode.width ?? 150,
            height: nodeProps?.height ?? currentNode.height ?? 50,
          },
          data: {
            ...currentNode.data,
            ...data,
          },
        };

        // Remove selected prop - we use Presence for selection
        const nodeWithoutSelected = removeSelectedFromNode(updatedNode);
        storageNodes.set(
          nodeId,
          new LiveObject(nodeWithoutSelected as unknown as LsonObject)
        );
      });
    },
    []
  );

  // Batch update edge data - for PropertiesPanel
  const batchUpdateEdgeData = useMutation(
    (
      { storage },
      edgeIds: string[],
      edgeData: Partial<Edge> & { data?: Record<string, unknown> }
    ) => {
      const storageEdges = storage.get("edges");
      if (!storageEdges) return;

      edgeIds.forEach((edgeId) => {
        const edgeObj = storageEdges.get(edgeId);
        if (!edgeObj) return;

        const currentEdge =
          edgeObj && typeof edgeObj === "object" && "toObject" in edgeObj
            ? (edgeObj as unknown as { toObject: () => Edge }).toObject()
            : (edgeObj as unknown as Edge);

        const updatedEdge: Edge = {
          ...currentEdge,
          ...edgeData,
          style: edgeData.style
            ? {
                ...(currentEdge.style as Record<string, string>),
                ...(edgeData.style as Record<string, string>),
              }
            : currentEdge.style,
          data: edgeData.data
            ? {
                ...(currentEdge.data as Record<string, unknown>),
                ...edgeData.data,
              }
            : currentEdge.data,
        };

        // Remove selected prop - we use Presence for selection
        const edgeWithoutSelected = removeSelectedFromEdge(updatedEdge);
        storageEdges.set(
          edgeId,
          new LiveObject(edgeWithoutSelected as unknown as LsonObject)
        );
      });
    },
    []
  );

  // Mutation to import mindmap data (replace or merge)
  const importMindmapData = useMutation(
    (
      { storage },
      mindmapData: {
        nodes: Node[] | Record<string, Node>;
        edges: Edge[] | Record<string, Edge>;
      },
      replaceExisting: boolean
    ) => {
      const storageNodes = storage.get("nodes");
      const storageEdges = storage.get("edges");
      if (!storageNodes || !storageEdges) return;

      if (replaceExisting) {
        // Clear existing nodes and edges
        storageNodes.forEach((_, id) => storageNodes.delete(id));
        storageEdges.forEach((_, id) => storageEdges.delete(id));
      }

      // Convert nodes to array if it's a dictionary
      const nodesArray = Array.isArray(mindmapData.nodes)
        ? mindmapData.nodes
        : Object.values(mindmapData.nodes);

      // Convert edges to array if it's a dictionary
      const edgesArray = Array.isArray(mindmapData.edges)
        ? mindmapData.edges
        : Object.values(mindmapData.edges);

      // Add new nodes (remove selected prop - we use Presence for selection)
      nodesArray.forEach((node) => {
        const nodeWithoutSelected = removeSelectedFromNode(node);
        storageNodes.set(
          node.id,
          new LiveObject(nodeWithoutSelected as unknown as LsonObject)
        );
      });

      // Add new edges (remove selected prop - we use Presence for selection)
      edgesArray.forEach((edge) => {
        const edgeWithoutSelected = removeSelectedFromEdge(edge);
        storageEdges.set(
          edge.id,
          new LiveObject(edgeWithoutSelected as unknown as LsonObject)
        );
      });
    },
    []
  );

  // Copy selected nodes and edges
  const copySelected = useCallback(
    (nodeIds: string[], edgeIds: string[]) => {
      const { copyToClipboard } = useDiagramStore.getState();
      const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));
      // Only copy edges where both source and target are selected
      const selectedEdges = edges.filter(
        (e) =>
          edgeIds.includes(e.id) &&
          nodeIds.includes(e.source) &&
          nodeIds.includes(e.target)
      );
      copyToClipboard(selectedNodes, selectedEdges);
      return {
        nodeCount: selectedNodes.length,
        edgeCount: selectedEdges.length,
      };
    },
    [nodes, edges]
  );

  // Paste mutation - adds pasted nodes and edges to Liveblocks
  const pasteMutation = useMutation(({ storage }) => {
    const { getClipboard } = useDiagramStore.getState();
    const clipboard = getClipboard();

    // Validation
    if (!clipboard || (!clipboard.nodes.length && !clipboard.edges.length)) {
      throw new Error("Clipboard is empty");
    }

    if (!Array.isArray(clipboard.nodes)) {
      throw new Error("Invalid clipboard data: nodes must be an array");
    }

    if (!Array.isArray(clipboard.edges)) {
      throw new Error("Invalid clipboard data: edges must be an array");
    }

    // Validate edge references
    const nodeIds = new Set(clipboard.nodes.map((n) => n.id));
    for (const edge of clipboard.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(
          "Invalid clipboard data: edge references missing nodes"
        );
      }
    }

    // Generate new IDs and offset positions
    const idMap = new Map<string, string>();
    const offsetX = 50;
    const offsetY = 50;

    const newNodes: Node[] = clipboard.nodes.map((node, index) => {
      const newId = `node-${Date.now()}-${index}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
      };
    });

    const newEdges: Edge[] = clipboard.edges.map((edge, index) => {
      const newId = `edge-${Date.now()}-${index}`;
      return {
        ...edge,
        id: newId,
        source: idMap.get(edge.source) ?? edge.source,
        target: idMap.get(edge.target) ?? edge.target,
      };
    });

    // Add to Liveblocks
    const storageNodes = storage.get("nodes");
    const storageEdges = storage.get("edges");
    if (!storageNodes || !storageEdges) {
      throw new Error("Storage not available");
    }

    // Add nodes (remove selected prop - we use Presence for selection)
    newNodes.forEach((node) => {
      const nodeWithoutSelected = removeSelectedFromNode(node);
      storageNodes.set(
        node.id,
        new LiveObject(nodeWithoutSelected as unknown as LsonObject)
      );
    });

    // Add edges (remove selected prop - we use Presence for selection)
    newEdges.forEach((edge) => {
      const edgeWithoutSelected = removeSelectedFromEdge(edge);
      storageEdges.set(
        edge.id,
        new LiveObject(edgeWithoutSelected as unknown as LsonObject)
      );
    });

    return {
      nodeIds: newNodes.map((n) => n.id),
      edgeIds: newEdges.map((e) => e.id),
    };
  }, []);

  // Paste function with error handling
  const paste = useCallback(async () => {
    try {
      const result = await pasteMutation();
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to paste",
      };
    }
  }, [pasteMutation]);

  return {
    nodes,
    edges,
    updateNodes,
    updateEdges,
    batchUpdateNodes,
    batchUpdateEdges,
    deleteNodesAndEdges,
    addNewEdge,
    addNode,
    addNodeWithEdge,
    batchUpdateNodeData,
    batchUpdateEdgeData,
    importMindmapData,
    copySelected,
    paste,
  };
}
