import { useCallback, useMemo, useRef, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";
import {
  nodeIntersectsBox,
  edgeIntersectsBox,
  isReactFlowElement,
  BoxBounds,
} from "../utils/intersection-utils";
import { MIN_MOVE_DISTANCE } from "../utils/interaction-constants";

export interface SelectionBoxState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface UseSelectionBoxOptions {
  isEnabled: boolean;
}

interface UseSelectionBoxReturn {
  selectionBox: SelectionBoxState | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: (e: MouseEvent) => void;
}

/**
 * Custom hook for handling selection box functionality
 */
export function useSelectionBox({
  isEnabled,
}: UseSelectionBoxOptions): UseSelectionBoxReturn {
  const reactFlowInstance = useReactFlow();
  const updateMyPresence = useUpdateMyPresence();
  const currentUser = useSelf();
  const [selectionBox, setSelectionBox] = useState<SelectionBoxState | null>(
    null
  );
  const isSelectingRef = useRef(false);
  const startPosRef = useRef<BoxBounds | null>(null);
  const hasMovedRef = useRef(false);
  const ctrlKeyRef = useRef(false);
  const paneRef = useRef<HTMLElement | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start selection if enabled and left mouse button
      if (!isEnabled || e.button !== 0 || !reactFlowInstance) {
        return;
      }

      // Don't handle if clicking on a node or edge
      const target = e.target as HTMLElement;
      if (isReactFlowElement(target) || target.closest(".node-context-menu")) {
        return;
      }

      // Store Ctrl/Cmd state
      ctrlKeyRef.current = e.ctrlKey || e.metaKey;

      // If not holding Ctrl/Cmd, clear selection first
      if (!ctrlKeyRef.current) {
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: [],
            edgeIds: [],
          },
        });
      }

      // Get or cache ReactFlow pane element
      if (!paneRef.current) {
        paneRef.current = (e.currentTarget as HTMLElement).closest(
          ".react-flow"
        ) as HTMLElement;
      }
      if (!paneRef.current) return;

      // Convert screen coordinates to flow coordinates
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      // Get screen position relative to pane for rendering
      const paneRect = paneRef.current.getBoundingClientRect();
      const relativeX = e.clientX - paneRect.left;
      const relativeY = e.clientY - paneRect.top;

      isSelectingRef.current = true;
      startPosRef.current = flowPosition;
      hasMovedRef.current = false;
      setSelectionBox({
        startX: relativeX,
        startY: relativeY,
        endX: relativeX,
        endY: relativeY,
      });
    },
    [isEnabled, reactFlowInstance, updateMyPresence]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !isSelectingRef.current ||
        !startPosRef.current ||
        !reactFlowInstance ||
        !paneRef.current
      ) {
        return;
      }

      // Check if mouse has moved enough
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const distance = Math.sqrt(
        Math.pow(flowPosition.x - startPosRef.current.x, 2) +
          Math.pow(flowPosition.y - startPosRef.current.y, 2)
      );

      if (distance > MIN_MOVE_DISTANCE) {
        hasMovedRef.current = true;
      }

      if (!hasMovedRef.current) return;

      // Get pane rect for relative position calculation
      const paneRect = paneRef.current.getBoundingClientRect();

      // Convert flow coordinates to screen coordinates
      const startScreenPos = reactFlowInstance.flowToScreenPosition(
        startPosRef.current
      );
      const endScreenPos = reactFlowInstance.flowToScreenPosition(flowPosition);

      // Calculate relative positions for rendering
      const startRelativeX = startScreenPos.x - paneRect.left;
      const startRelativeY = startScreenPos.y - paneRect.top;
      const endRelativeX = endScreenPos.x - paneRect.left;
      const endRelativeY = endScreenPos.y - paneRect.top;

      // Update selection box visual only - don't update selection yet
      setSelectionBox({
        startX: startRelativeX,
        startY: startRelativeY,
        endX: endRelativeX,
        endY: endRelativeY,
      });
    },
    [reactFlowInstance]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (e.button !== 0 || !isSelectingRef.current) return;

      // If user didn't drag, don't change selection
      if (!hasMovedRef.current) {
        setSelectionBox(null);
        isSelectingRef.current = false;
        startPosRef.current = null;
        hasMovedRef.current = false;
        ctrlKeyRef.current = false;
        return;
      }

      // Only update selection when mouse is released
      if (startPosRef.current && reactFlowInstance && paneRef.current) {
        // Get final mouse position in flow coordinates
        const endFlowPosition = reactFlowInstance.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });

        // Find nodes and edges in selection box
        const nodes = reactFlowInstance.getNodes();
        const edges = reactFlowInstance.getEdges();

        const selectedNodeIds = nodes
          .filter((node) =>
            nodeIntersectsBox(node, startPosRef.current!, endFlowPosition)
          )
          .map((node) => node.id);

        const selectedEdgeIds = edges
          .filter((edge) =>
            edgeIntersectsBox(
              edge,
              startPosRef.current!,
              endFlowPosition,
              nodes
            )
          )
          .map((edge) => edge.id);

        // Get current selection from Presence at the time of mouse up
        const currentSelectionAtRelease = currentUser?.presence
          ?.selectedObjectIds ?? {
          nodeIds: [],
          edgeIds: [],
        };

        // Merge with existing selection if Ctrl/Cmd is held
        const finalNodeIds = ctrlKeyRef.current
          ? [
              ...new Set([
                ...currentSelectionAtRelease.nodeIds,
                ...selectedNodeIds,
              ]),
            ]
          : selectedNodeIds;
        const finalEdgeIds = ctrlKeyRef.current
          ? [
              ...new Set([
                ...currentSelectionAtRelease.edgeIds,
                ...selectedEdgeIds,
              ]),
            ]
          : selectedEdgeIds;

        // Update Presence only when mouse is released
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: finalNodeIds,
            edgeIds: finalEdgeIds,
          },
        });
      }

      // Cleanup
      setSelectionBox(null);
      isSelectingRef.current = false;
      startPosRef.current = null;
      hasMovedRef.current = false;
      ctrlKeyRef.current = false;
    },
    [
      reactFlowInstance,
      currentUser?.presence?.selectedObjectIds,
      updateMyPresence,
    ]
  );

  return useMemo(
    () => ({
      selectionBox,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
    }),
    [selectionBox, handleMouseDown, handleMouseMove, handleMouseUp]
  );
}
