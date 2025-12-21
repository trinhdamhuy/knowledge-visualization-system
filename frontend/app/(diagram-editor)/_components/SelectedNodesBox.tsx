import { useSelectedNodesBox } from "./hooks/use-selected-nodes-box";
import { useReactFlow, useStore } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useWheelZoom } from "./hooks/use-wheel-zoom";

interface SelectedNodesBoxProps {
  onDragStart?: () => void;
  onDragStop?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

/**
 * Component for rendering selection box around selected nodes
 * and allowing drag to move all selected nodes
 */
export function SelectedNodesBox({
  onDragStart,
  onDragStop,
  onContextMenu,
}: SelectedNodesBoxProps) {
  const reactFlowInstance = useReactFlow();
  const { box, isDragging, handleMouseDown } = useSelectedNodesBox();

  // Notify parent when drag starts/stops
  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    } else {
      onDragStop?.();
    }
  }, [isDragging, onDragStart, onDragStop]);
  const wheelZoom = useWheelZoom({ reactFlowInstance });
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to viewport changes
  const viewport = useStore((state) => state.transform);
  const zoom = viewport[2];

  // Update container position when viewport or box changes
  useEffect(() => {
    if (!box || !containerRef.current) return;

    // Convert flow coordinates to screen coordinates (relative to pane)
    const screenPosition = reactFlowInstance.flowToScreenPosition({
      x: box.x,
      y: box.y,
    });

    // flowToScreenPosition returns coordinates relative to ReactFlow pane
    // So we can use them directly
    containerRef.current.style.left = `${screenPosition.x}px`;
    containerRef.current.style.top = `${screenPosition.y}px`;
    containerRef.current.style.width = `${box.width * zoom}px`;
    containerRef.current.style.height = `${box.height * zoom}px`;
  }, [box, reactFlowInstance, zoom, viewport]);

  if (!box) return null;

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
        className="pointer-events-auto"
        style={{
          position: "absolute",
          border: "2px solid #3b82f6",
          borderRadius: "4px",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
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
