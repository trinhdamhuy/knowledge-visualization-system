import { useCallback, useState, useMemo, useRef } from "react";
import { Node, Edge } from "@xyflow/react";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";

interface ContextMenuState {
  nodeId: string;
  position: { x: number; y: number };
}

interface UseContextMenuReturn {
  contextMenu: ContextMenuState | null;
  handleNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  handleEdgeContextMenu: (event: React.MouseEvent, edge: Edge) => void;
  handlePaneContextMenu: (event: React.MouseEvent) => void;
  handlePaneMouseDown: (event: React.MouseEvent) => void;
  handlePaneClick: (event: React.MouseEvent) => void;
  closeContextMenu: () => void;
}

/**
 * Custom hook for handling context menu (right-click)
 */
export function useContextMenu(): UseContextMenuReturn {
  const updateMyPresence = useUpdateMyPresence();
  const currentUser = useSelf();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const rightClickStartRef = useRef<{ x: number; y: number } | null>(null);

  const currentSelection = useMemo(
    () =>
      currentUser?.presence?.selectedObjectIds ?? {
        nodeIds: [],
        edgeIds: [],
      },
    [currentUser?.presence?.selectedObjectIds]
  );

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();

      // If selection is empty or node is not in selection, select this node
      if (
        currentSelection.nodeIds.length === 0 ||
        !currentSelection.nodeIds.includes(node.id)
      ) {
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: [node.id],
            edgeIds: [],
          },
        });
      }

      // Show context menu based on current selection
      setContextMenu({
        nodeId: node.id, // Keep for backward compatibility
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [currentSelection.nodeIds, updateMyPresence]
  );

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();

      // If selection is empty or edge is not in selection, select this edge
      if (
        currentSelection.edgeIds.length === 0 ||
        !currentSelection.edgeIds.includes(edge.id)
      ) {
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: [], // Clear node selection when selecting edges
            edgeIds: [edge.id],
          },
        });
      }

      // Show context menu based on current selection
      setContextMenu({
        nodeId: "", // No node selected when right-clicking edge
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [currentSelection.edgeIds, updateMyPresence]
  );

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      // Only show context menu if it's a click (not drag)
      // Check if mouse moved significantly from mousedown position
      // If rightClickStartRef is set, it means we tracked the mousedown
      if (rightClickStartRef.current) {
        const distance = Math.sqrt(
          Math.pow(event.clientX - rightClickStartRef.current.x, 2) +
            Math.pow(event.clientY - rightClickStartRef.current.y, 2)
        );
        // If moved more than 5px, it's a drag (pan), don't show menu
        if (distance > 5) {
          rightClickStartRef.current = null;
          return;
        }
        // Clear tracking after checking
        rightClickStartRef.current = null;
      }
      // If rightClickStartRef is not set, it might be a direct context menu event
      // (not from our tracking), so we'll show the menu anyway

      // Always show context menu when right-clicking on pane
      // Use first selected node ID if available, otherwise empty string
      setContextMenu({
        nodeId:
          currentSelection.nodeIds.length > 0
            ? currentSelection.nodeIds[0]
            : "", // Keep for backward compatibility
        position: { x: event.clientX, y: event.clientY },
      });
    },
    [currentSelection.nodeIds]
  );

  const handlePaneMouseDown = useCallback((event: React.MouseEvent) => {
    // Track right mouse button down position for pan detection
    if (event.button === 2) {
      rightClickStartRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    }
  }, []);

  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Don't close if right-clicking (for pan)
      if (event.button === 2) return;

      // Close context menu if open
      if (contextMenu) {
        setContextMenu(null);
      }

      // Clear right click tracking
      rightClickStartRef.current = null;
    },
    [contextMenu]
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return useMemo(
    () => ({
      contextMenu,
      handleNodeContextMenu,
      handleEdgeContextMenu,
      handlePaneContextMenu,
      handlePaneMouseDown,
      handlePaneClick,
      closeContextMenu,
    }),
    [
      contextMenu,
      handleNodeContextMenu,
      handleEdgeContextMenu,
      handlePaneContextMenu,
      handlePaneMouseDown,
      handlePaneClick,
      closeContextMenu,
    ]
  );
}
