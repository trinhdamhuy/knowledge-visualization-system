"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useReactFlow, Node, Edge } from "@xyflow/react";
import { useSelf } from "@liveblocks/react";
import { DiagramMode } from "@/enums/modes";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { NodeContextMenu } from "./NodeContextMenu";
import { SelectionBoxVisual } from "./SelectionBoxVisual";
import { usePanHandler } from "./hooks/use-pan-handler";
import { useSelectionBox } from "./hooks/use-selection-box";
import { useWheelZoom } from "./hooks/use-wheel-zoom";
import { useContextMenu } from "./hooks/use-context-menu";
import { useKeyboardHandler } from "./hooks/use-keyboard-handler";
import { isReactFlowElement } from "./utils/intersection-utils";

interface InteractionHandlers {
  onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
  onEdgeContextMenu?: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick: (event: React.MouseEvent) => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
  onPaneMouseDown?: (event: React.MouseEvent) => void;
}

/**
 * Combined interaction handler that manages both panning (right mouse)
 * and selection box (left mouse) in a single component to avoid conflicts
 */
export function CombinedInteractionHandler({
  onHandlersReady,
}: {
  onHandlersReady?: (handlers: InteractionHandlers) => void;
}) {
  const reactFlowInstance = useReactFlow();
  const currentUser = useSelf();
  const { activeMode } = useDiagramStore();

  // Only enable selection box in Select mode
  const isSelectionEnabled = activeMode === DiagramMode.Select;

  // Get current selection from Presence
  const currentSelection = useMemo(
    () =>
      currentUser?.presence?.selectedObjectIds ?? {
        nodeIds: [],
        edgeIds: [],
      },
    [currentUser?.presence?.selectedObjectIds]
  );

  // Initialize custom hooks
  const panHandler = usePanHandler({ reactFlowInstance });
  const selectionBox = useSelectionBox({ isEnabled: isSelectionEnabled });
  const wheelZoom = useWheelZoom({ reactFlowInstance });
  const contextMenu = useContextMenu();
  useKeyboardHandler(); // Handle keyboard shortcuts (backspace, etc.)

  // Handle mouse down on pane (for selection box and pan)
  const handleGlobalMouseDown = useCallback(
    (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Only handle if clicking on pane (not node/edge)
      if (isReactFlowElement(target) || target.closest(".node-context-menu")) {
        return;
      }
      // Check if clicking inside ReactFlow pane
      const reactFlowPane = target.closest(".react-flow");
      if (!reactFlowPane) return;

      // Convert to React.MouseEvent-like object for handlers
      const reactEvent = {
        ...e,
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        target: e.target,
        currentTarget: reactFlowPane,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      } as unknown as React.MouseEvent;

      // Track right mouse button for pan detection
      contextMenu.handlePaneMouseDown(reactEvent);
      // Handle pan and selection
      panHandler.handleMouseDown(reactEvent);
      selectionBox.handleMouseDown(reactEvent);
    },
    [panHandler, selectionBox, contextMenu]
  );

  // Combined mouse move handler - handles both pan and selection
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      panHandler.handleMouseMove(e);
      selectionBox.handleMouseMove(e);
    },
    [panHandler, selectionBox]
  );

  // Combined mouse up handler - handles both pan and selection cleanup
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      panHandler.handleMouseUp(e);
      selectionBox.handleMouseUp(e);
    },
    [panHandler, selectionBox]
  );

  // Set up global mouse event listeners
  useEffect(() => {
    window.addEventListener("mousedown", handleGlobalMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleGlobalMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleGlobalMouseDown, handleMouseMove, handleMouseUp]);

  // Create handlers object and expose via callback
  const handlers: InteractionHandlers = useMemo(
    () => ({
      onNodeContextMenu: contextMenu.handleNodeContextMenu,
      onEdgeContextMenu: contextMenu.handleEdgeContextMenu,
      onPaneClick: contextMenu.handlePaneClick,
      onPaneContextMenu: contextMenu.handlePaneContextMenu,
      onPaneMouseDown: contextMenu.handlePaneMouseDown,
    }),
    [
      contextMenu.handleNodeContextMenu,
      contextMenu.handleEdgeContextMenu,
      contextMenu.handlePaneClick,
      contextMenu.handlePaneContextMenu,
      contextMenu.handlePaneMouseDown,
    ]
  );

  // Expose handlers to parent
  useEffect(() => {
    onHandlersReady?.(handlers);
  }, [handlers, onHandlersReady]);

  // Handle click outside to close context menu
  useEffect(() => {
    if (!contextMenu.contextMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the context menu
      if (target.closest(".node-context-menu")) {
        return;
      }
      // Close context menu when clicking outside
      contextMenu.closeContextMenu();
    };

    // Use capture phase to catch clicks before they reach other handlers
    // Small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [contextMenu]);

  return (
    <>
      {/* Overlay for wheel - doesn't block node/edge clicks */}
      <div
        className="absolute inset-0 z-5"
        style={{ pointerEvents: "none" }}
        onWheel={(e) => {
          // Only handle wheel if not on node/edge
          const target = e.target as HTMLElement;
          if (isReactFlowElement(target)) {
            return;
          }
          wheelZoom.handleWheel(e);
        }}
      />
      {/* Selection box overlay (for selecting) */}
      {selectionBox.selectionBox && (
        <SelectionBoxVisual selectionBox={selectionBox.selectionBox} />
      )}
      {/* Context menu */}
      {contextMenu.contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.contextMenu.nodeId}
          selectedNodeIds={currentSelection.nodeIds}
          selectedEdgeIds={currentSelection.edgeIds}
          position={contextMenu.contextMenu.position}
          onClose={contextMenu.closeContextMenu}
        />
      )}
    </>
  );
}
