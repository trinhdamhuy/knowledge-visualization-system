"use client";

import { useReactFlow, useStore } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useWheelZoom } from "./hooks/use-wheel-zoom";
import type { SelectionBoxState } from "./hooks/use-selection-box";
import type { SelectedNodesBoxState } from "./hooks/use-selected-nodes-box";

interface SelectionBoxProps {
  // For selection box (when dragging to select)
  selectionBox?: SelectionBoxState | null;
  // For selected nodes box (bounding box of selected nodes)
  selectedNodesBox?: SelectedNodesBoxState | null;
  // Drag handlers for selected nodes box
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onDragStart?: () => void;
  onDragStop?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

/**
 * Unified component for rendering selection boxes
 * Handles both:
 * - Selection box (when dragging to select nodes/edges)
 * - Selected nodes box (bounding box around selected nodes with drag support)
 */
export function SelectionBox({
  selectionBox,
  selectedNodesBox,
  isDragging = false,
  onMouseDown,
  onDragStart,
  onDragStop,
  onContextMenu,
}: SelectionBoxProps) {
  const reactFlowInstance = useReactFlow();
  const wheelZoom = useWheelZoom({ reactFlowInstance });
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to viewport changes for selected nodes box
  const viewport = useStore((state) => state.transform);
  const zoom = viewport[2];

  // Handle selected nodes box (with drag support)
  // Notify parent when drag starts/stops
  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    } else {
      onDragStop?.();
    }
  }, [isDragging, onDragStart, onDragStop]);

  // Update container position when viewport or box changes
  useEffect(() => {
    if (!selectedNodesBox || !containerRef.current) return;

    // Get ReactFlow pane element to calculate relative position
    const paneElement = document.querySelector(".react-flow") as HTMLElement;
    if (!paneElement) return;

    const paneRect = paneElement.getBoundingClientRect();

    // Convert flow coordinates to screen coordinates (relative to viewport)
    const screenPosition = reactFlowInstance.flowToScreenPosition({
      x: selectedNodesBox.x,
      y: selectedNodesBox.y,
    });

    // Calculate relative positions for rendering (relative to ReactFlow pane)
    const relativeX = screenPosition.x - paneRect.left;
    const relativeY = screenPosition.y - paneRect.top;

    containerRef.current.style.left = `${relativeX}px`;
    containerRef.current.style.top = `${relativeY}px`;
    containerRef.current.style.width = `${selectedNodesBox.width * zoom}px`;
    containerRef.current.style.height = `${selectedNodesBox.height * zoom}px`;
  }, [selectedNodesBox, reactFlowInstance, zoom, viewport]);

  // Handle selection box (simple visual, no interaction)
  if (selectionBox) {
    return (
      <div
        className="absolute inset-0 pointer-events-auto z-5"
        style={{
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <div
          className="border-2 border-primary bg-primary/10 rounded-xs absolute"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY),
          }}
        />
      </div>
    );
  }

  if (!selectedNodesBox) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-5"
      style={{
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        ref={containerRef}
        className="pointer-events-auto border-2 border-primary bg-primary/10 rounded-xs"
        style={{
          position: "absolute",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={onMouseDown}
        onContextMenu={(e) => {
          // Handle right-click to open context menu
          // Only if not dragging (left-click drag)
          if (!isDragging && onContextMenu) {
            e.preventDefault();
            e.stopPropagation();
            onContextMenu(e);
          }
        }}
        onWheel={(e) => {
          // Allow wheel zoom to work inside selection box
          wheelZoom.handleWheel(e);
        }}
      />
    </div>
  );
}
