import { useCallback, useMemo } from "react";
import { ReactFlowInstance } from "@xyflow/react";
import { isReactFlowElement } from "../utils/intersection-utils";
import { MIN_ZOOM, MAX_ZOOM } from "../utils/interaction-constants";

interface UseWheelZoomOptions {
  reactFlowInstance: ReactFlowInstance | null;
}

interface UseWheelZoomReturn {
  handleWheel: (e: React.WheelEvent) => void;
}

/**
 * Custom hook for handling wheel zoom
 */
export function useWheelZoom({
  reactFlowInstance,
}: UseWheelZoomOptions): UseWheelZoomReturn {
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!reactFlowInstance) return;

      // Don't zoom if scrolling on a node or edge
      if (isReactFlowElement(e.target as HTMLElement)) {
        return;
      }

      // Prevent default scrolling and browser zoom
      e.preventDefault();
      e.stopPropagation();

      // Get current viewport
      const viewport = reactFlowInstance.getViewport();
      const currentZoom = viewport.zoom;

      // Determine zoom direction (positive = zoom out, negative = zoom in)
      const zoomDirection = e.deltaY > 0 ? -1 : 1;

      // Calculate new zoom with 25% increment per step
      // Zoom in: multiply by 1.25 (+25%), Zoom out: multiply by 0.75 (-25%)
      const zoomMultiplier = zoomDirection > 0 ? 1.25 : 0.75;
      let newZoom = currentZoom * zoomMultiplier;

      // Clamp to min/max zoom limits
      newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

      // Get mouse position relative to the ReactFlow pane
      // Try to find the ReactFlow pane from the event target
      let reactFlowPane: HTMLElement | null = null;
      let element: HTMLElement | null = e.target as HTMLElement;

      // Traverse up the DOM tree to find the ReactFlow pane
      while (element && !reactFlowPane) {
        if (element.classList.contains("react-flow")) {
          reactFlowPane = element;
        } else {
          element = element.parentElement;
        }
      }

      if (!reactFlowPane) {
        // Fallback: zoom to center if can't find pane
        reactFlowInstance.zoomTo(newZoom);
        return;
      }

      const paneRect = reactFlowPane.getBoundingClientRect();
      const mouseX = e.clientX - paneRect.left;
      const mouseY = e.clientY - paneRect.top;

      // Calculate new viewport position to keep mouse point fixed
      // Formula: newViewportX = viewportX * zoomRatio + mouseX * (1 - zoomRatio)
      // Where zoomRatio = newZoom / currentZoom
      // This ensures the flow position under the mouse cursor stays fixed
      const zoomRatio = newZoom / currentZoom;
      const newX = viewport.x * zoomRatio + mouseX * (1 - zoomRatio);
      const newY = viewport.y * zoomRatio + mouseY * (1 - zoomRatio);

      // Set viewport with new zoom and position
      reactFlowInstance.setViewport({ x: newX, y: newY, zoom: newZoom });
    },
    [reactFlowInstance]
  );

  return useMemo(() => ({ handleWheel }), [handleWheel]);
}
