"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";
import { useFileCardStore } from "../_stores/use-file-card-store";
import { getDescendantNodeIds } from "./utils/collapse-utils";

interface ContextMenuProps {
  nodeId: string; // Keep for backward compatibility
  selectedNodeIds: string[]; // Use this instead
  selectedEdgeIds?: string[]; // Add edge support
  position: { x: number; y: number };
  onClose: () => void;
}

export function NodeContextMenu({
  nodeId,
  selectedNodeIds,
  selectedEdgeIds, // Keep for backward compatibility but not used (edges can't be copied)
  position,
  onClose,
}: ContextMenuProps) {
  // Suppress unused variable warning - kept for backward compatibility
  void selectedEdgeIds;
  const {
    nodes,
    edges,
    addNodeWithEdge,
    deleteNodesAndEdges,
    copySelected,
    paste,
    batchUpdateEdgeData,
    batchUpdateNodeData,
  } = useDiagramSync();
  const updateMyPresence = useUpdateMyPresence();
  const currentUser = useSelf();
  const menuRef = useRef<HTMLDivElement>(null);

  // Use selectedNodeIds if available, otherwise fall back to nodeId
  const effectiveNodeIds = useMemo(
    () => (selectedNodeIds.length > 0 ? selectedNodeIds : [nodeId]),
    [selectedNodeIds, nodeId]
  );
  const selectedNodes = nodes.filter((n) => effectiveNodeIds.includes(n.id));

  // Only allow "Add child" if exactly one node is selected
  const canAddChild = selectedNodes.length === 1;

  // Check if exactly one node is selected (for reference options)
  const canChangeReference = selectedNodes.length === 1;

  // Expand/Collapse only for a single node
  const canToggleCollapse = selectedNodes.length === 1;
  const isCollapsed = useMemo(() => {
    if (!canToggleCollapse) return false;
    const data = selectedNodes[0]?.data as { collapsed?: boolean } | undefined;
    return Boolean(data?.collapsed);
  }, [canToggleCollapse, selectedNodes]);

  // Check if selected node has pageReference
  const hasPageReference = useMemo(() => {
    if (selectedNodes.length !== 1) return false;
    const nodeData = selectedNodes[0].data as
      | { pageReference?: number }
      | undefined;
    return nodeData?.pageReference && nodeData.pageReference > 0;
  }, [selectedNodes]);

  // Get current selection to also delete connected edges
  const currentSelection = useMemo(
    () =>
      currentUser?.presence?.selectedObjectIds ?? {
        nodeIds: [],
        edgeIds: [],
      },
    [currentUser?.presence?.selectedObjectIds]
  );

  const handleCopy = useCallback(() => {
    // Only copy nodes, not edges
    if (effectiveNodeIds.length === 0) return;
    copySelected(effectiveNodeIds, []); // Don't copy edges
    onClose();
  }, [effectiveNodeIds, copySelected, onClose]);

  const handleCut = useCallback(() => {
    // Only cut nodes, not edges
    if (effectiveNodeIds.length === 0) return;

    // First, copy nodes to clipboard
    copySelected(effectiveNodeIds, []); // Don't copy edges

    // Also delete edges connected to deleted nodes
    const connectedEdgeIds = edges
      .filter(
        (edge) =>
          effectiveNodeIds.includes(edge.source) ||
          effectiveNodeIds.includes(edge.target)
      )
      .map((edge) => edge.id);

    // Delete nodes and edges in a single operation (creates only one undo entry)
    if (effectiveNodeIds.length > 0 || connectedEdgeIds.length > 0) {
      deleteNodesAndEdges({
        nodeIds: effectiveNodeIds,
        edgeIds: connectedEdgeIds,
      });
    }

    // Clear selection
    updateMyPresence({
      selectedObjectIds: {
        nodeIds: [],
        edgeIds: [],
      },
    });

    onClose();
  }, [
    effectiveNodeIds,
    copySelected,
    edges,
    deleteNodesAndEdges,
    updateMyPresence,
    onClose,
  ]);

  const handleDelete = useCallback(() => {
    const { nodeIds, edgeIds } = currentSelection;

    if (nodeIds.length === 0 && edgeIds.length === 0) {
      return;
    }

    // Also delete edges connected to deleted nodes
    const connectedEdgeIds = edges
      .filter(
        (edge) => nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
      )
      .map((edge) => edge.id);

    // Combine all edge IDs (remove duplicates)
    const allEdgeIds = Array.from(new Set([...edgeIds, ...connectedEdgeIds]));

    // Delete nodes and edges in a single operation (creates only one undo entry)
    if (nodeIds.length > 0 || allEdgeIds.length > 0) {
      deleteNodesAndEdges({
        nodeIds,
        edgeIds: allEdgeIds,
      });
    }

    // Clear selection
    updateMyPresence({
      selectedObjectIds: {
        nodeIds: [],
        edgeIds: [],
      },
    });

    onClose();
  }, [currentSelection, edges, deleteNodesAndEdges, updateMyPresence, onClose]);

  const handleAddChild = useCallback(() => {
    if (!canAddChild || selectedNodes.length === 0) return;

    const parentNode = selectedNodes[0];
    if (!parentNode) return;

    // If parent is collapsed, expand it so the new child is visible
    const parentData = parentNode.data as { collapsed?: boolean } | undefined;
    if (parentData?.collapsed) {
      batchUpdateNodeData([parentNode.id], { collapsed: false });
    }

    const childrenEdges = edges.filter((e) => e.source === parentNode.id);
    const childrenCount = childrenEdges.length;

    const isChildNode = edges.some((e) => e.target === parentNode.id);

    const hasGrandchildren = childrenEdges.some((edge) => {
      const childId = edge.target;
      return edges.some((e) => e.source === childId);
    });

    if (isChildNode && childrenCount > 0 && hasGrandchildren) {
      let currentNode = parentNode;
      let extendEdge = edges.find((e) => e.source === currentNode.id);

      while (extendEdge) {
        const nextNode = nodes.find((n) => n.id === extendEdge!.target);
        if (!nextNode) break;

        const nextExtend = edges.find((e) => e.source === nextNode.id);
        if (nextExtend) {
          currentNode = nextNode;
          extendEdge = nextExtend;
        } else {
          currentNode = nextNode;
          break;
        }
      }

      const newNodeId = `${currentNode.id}-ext-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        position: {
          x: currentNode.position.x + 150,
          y: currentNode.position.y,
        },
        type: "custom",
        width: 150,
        height: 50,
        data: {
          label: `New Topic 1`,
        },
      };

      const newEdge = {
        id: `e-${currentNode.id}-${newNodeId}`,
        type: "custom",
        source: currentNode.id,
        target: newNodeId,
      };

      addNodeWithEdge(newNode, newEdge);
    } else {
      const newNodeId = `${parentNode.id}-child-${
        childrenCount + 1
      }-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: "custom",
        position: {
          x: parentNode.position.x + 200,
          y: parentNode.position.y + childrenCount * 80 - childrenCount * 40,
        },
        width: 150,
        height: 50,
        data: {
          label: `New Topic ${childrenCount + 1}`,
        },
      };

      const newEdge = {
        id: `e-${parentNode.id}-${newNodeId}`,
        source: parentNode.id,
        target: newNodeId,
        type: "custom",
      };

      addNodeWithEdge(newNode, newEdge);
    }

    onClose();
  }, [
    canAddChild,
    selectedNodes,
    nodes,
    edges,
    addNodeWithEdge,
    batchUpdateNodeData,
    onClose,
  ]);

  const handleToggleCollapse = useCallback(() => {
    if (!canToggleCollapse || selectedNodes.length !== 1) return;
    const node = selectedNodes[0];
    if (!node) return;

    const nextCollapsed = !isCollapsed;
    batchUpdateNodeData([node.id], { collapsed: nextCollapsed });

    // If collapsing, ensure we don't keep hidden descendants selected
    if (nextCollapsed) {
      const descendants = getDescendantNodeIds(node.id, edges);

      const nextNodeIds = currentSelection.nodeIds.filter(
        (id) => !descendants.has(id)
      );
      const nextEdgeIds = currentSelection.edgeIds.filter((edgeId) => {
        const edge = edges.find((e) => e.id === edgeId);
        if (!edge) return true;
        return !descendants.has(edge.source) && !descendants.has(edge.target);
      });

      if (
        nextNodeIds.length !== currentSelection.nodeIds.length ||
        nextEdgeIds.length !== currentSelection.edgeIds.length
      ) {
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: nextNodeIds,
            edgeIds: nextEdgeIds,
          },
        });
      }
    }

    onClose();
  }, [
    canToggleCollapse,
    selectedNodes,
    isCollapsed,
    batchUpdateNodeData,
    edges,
    currentSelection.nodeIds,
    currentSelection.edgeIds,
    updateMyPresence,
    onClose,
  ]);

  // Check if there's any selection - use currentSelection from Presence
  // Don't use effectiveNodeIds as it has fallback to nodeId which may not reflect actual selection
  const hasSelection =
    currentSelection.nodeIds.length > 0 || currentSelection.edgeIds.length > 0;

  // Only show copy/paste for nodes, not edges
  const hasNodeSelection = currentSelection.nodeIds.length > 0;
  const hasEdgeSelection = currentSelection.edgeIds.length > 0;

  // Check if any selected edge has a label
  const hasEdgeWithLabel = useMemo(() => {
    if (!hasEdgeSelection) return false;
    return currentSelection.edgeIds.some((edgeId) => {
      const edge = edges.find((e) => e.id === edgeId);
      const edgeData = edge?.data as { label?: string } | undefined;
      return edgeData?.label && edgeData.label !== "";
    });
  }, [hasEdgeSelection, currentSelection.edgeIds, edges]);

  const handlePaste = useCallback(async () => {
    await paste();
    onClose();
  }, [paste, onClose]);

  const handleAddLabel = useCallback(() => {
    if (currentSelection.edgeIds.length === 0) return;

    // Add default label "new label" to all selected edges
    currentSelection.edgeIds.forEach((edgeId) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;

      batchUpdateEdgeData([edgeId], {
        data: {
          ...(edge.data || {}),
          label: "new label",
        },
      });
    });

    onClose();
  }, [currentSelection.edgeIds, edges, batchUpdateEdgeData, onClose]);

  const handleDeleteLabel = useCallback(() => {
    if (currentSelection.edgeIds.length === 0) return;

    // Delete label by setting it to empty string
    currentSelection.edgeIds.forEach((edgeId) => {
      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;

      batchUpdateEdgeData([edgeId], {
        data: {
          ...(edge.data || {}),
          label: "",
        },
      });
    });

    onClose();
  }, [currentSelection.edgeIds, edges, batchUpdateEdgeData, onClose]);

  const { openPdfPage } = useFileCardStore();

  // Handle "Change REFERENCE" - focus on pageReference input in PropertiesPanel
  const handleChangeReference = useCallback(() => {
    if (selectedNodes.length !== 1) return;

    // Dispatch custom event to focus on pageReference input
    window.dispatchEvent(
      new CustomEvent("focus-page-reference-input", {
        detail: { nodeId: selectedNodes[0].id },
      })
    );

    onClose();
  }, [selectedNodes, onClose]);

  // Handle "Open REFERENCE" - open PDF page
  const handleOpenReference = useCallback(() => {
    if (selectedNodes.length !== 1) return;

    const node = selectedNodes[0];
    const nodeData = node.data as { pageReference?: number } | undefined;
    const pageRef = nodeData?.pageReference;

    if (!pageRef || pageRef <= 0) return;
    openPdfPage(pageRef);

    onClose();
  }, [selectedNodes, openPdfPage, onClose]);

  const options: Array<{
    label: string;
    kbd: React.ReactNode;
    onClick: () => void;
    variant?: "destructive";
  }> = [
    // Expand / Collapse - only when exactly one node is selected
    ...(canToggleCollapse
      ? [
          {
            label: isCollapsed ? "Expand" : "Collapse",
            kbd: null,
            onClick: handleToggleCollapse,
          },
        ]
      : []),
    // Change REFERENCE - only when exactly one node is selected
    ...(canChangeReference
      ? [
          {
            label: "Change REFERENCE",
            kbd: null,
            onClick: handleChangeReference,
          },
        ]
      : []),
    // Open REFERENCE - only when exactly one node is selected and has pageReference
    ...(canChangeReference && hasPageReference
      ? [
          {
            label: "Open REFERENCE",
            kbd: null,
            onClick: handleOpenReference,
          },
        ]
      : []),
    // Add label - only shown when there are edges selected
    ...(hasEdgeSelection
      ? [
          {
            label: "Add label",
            kbd: null,
            onClick: handleAddLabel,
          },
        ]
      : []),
    // Delete label - only shown when there are edges selected with labels
    ...(hasEdgeWithLabel
      ? [
          {
            label: "Delete label",
            kbd: null,
            onClick: handleDeleteLabel,
            variant: "destructive" as const,
          },
        ]
      : []),
    // Paste - only shown when there are nodes (not only edges)
    ...(hasNodeSelection
      ? [
          {
            label: "Paste",
            kbd: (
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>V</Kbd>
              </KbdGroup>
            ),
            onClick: handlePaste,
          },
        ]
      : []),
    // Add child - only when exactly one node is selected
    ...(canAddChild
      ? [
          {
            label: "Add child",
            kbd: <Kbd>+</Kbd>,
            onClick: handleAddChild,
          },
        ]
      : []),
    // Copy - only when there are nodes selected (not only edges)
    ...(hasNodeSelection
      ? [
          {
            label: "Copy",
            kbd: (
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>C</Kbd>
              </KbdGroup>
            ),
            onClick: handleCopy,
          },
        ]
      : []),
    // Cut - only when there are nodes selected (not only edges)
    ...(hasNodeSelection
      ? [
          {
            label: "Cut",
            kbd: (
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>X</Kbd>
              </KbdGroup>
            ),
            onClick: handleCut,
          },
        ]
      : []),
    // Delete - shown when there's any selection (nodes or edges)
    ...(hasSelection
      ? [
          {
            label: "Delete",
            kbd: <Kbd>Del</Kbd>,
            onClick: handleDelete,
          },
        ]
      : []),
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't close if clicking inside the menu
      if (
        menuRef.current &&
        e.target &&
        menuRef.current.contains(e.target as HTMLElement)
      ) {
        return;
      }
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      // Close menu when right-clicking elsewhere
      if (
        menuRef.current &&
        e.target &&
        !menuRef.current.contains(e.target as HTMLElement)
      ) {
        onClose();
      }
    };

    // Use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener("click", handleClick, true);
      document.addEventListener("contextmenu", handleContextMenu, true);
    }, 0);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
      className="node-context-menu fixed bg-card text-card-foreground border rounded-lg shadow-lg w-[170px] space-y-1 p-1 z-50"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {options.map((option) => (
        <Button
          key={option.label}
          onClick={option.onClick}
          variant="ghost"
          className="w-full justify-between min-h-fit px-2 py-1"
          size="sm"
        >
          <span className="flex items-center gap-2">{option.label}</span>
          {option.kbd}
        </Button>
      ))}
    </div>
  );
}
