import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useReactFlow, useStore } from "@xyflow/react";
import { useSelf } from "@liveblocks/react";
import { useDiagramSync } from "@/hooks/use-diagram-sync";

export interface SelectedNodesBoxState {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseSelectedNodesBoxReturn {
  box: SelectedNodesBoxState | null;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Custom hook for handling selected nodes bounding box and drag
 */
export function useSelectedNodesBox(): UseSelectedNodesBoxReturn {
  const reactFlowInstance = useReactFlow();
  const currentUser = useSelf();
  const { updateNodes } = useDiagramSync();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    nodePositions: Map<string, { x: number; y: number }>;
  } | null>(null);

  // Get current selection from Presence
  const currentSelection = useMemo(
    () =>
      currentUser?.presence?.selectedObjectIds ?? {
        nodeIds: [],
        edgeIds: [],
      },
    [currentUser?.presence?.selectedObjectIds]
  );

  // Subscribe to nodes to recalculate box when nodes move
  const nodes = useStore((state) => state.nodes);

  // Calculate bounding box for selected nodes
  // Only show when 2 or more nodes are selected
  const box = useMemo<SelectedNodesBoxState | null>(() => {
    if (!reactFlowInstance || currentSelection.nodeIds.length < 2) {
      return null;
    }

    const selectedNodes = nodes.filter((node) =>
      currentSelection.nodeIds.includes(node.id)
    );

    if (selectedNodes.length < 2) {
      return null;
    }

    // Calculate bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedNodes.forEach((node) => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 50;
      const x = node.position.x;
      const y = node.position.y;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + nodeWidth);
      maxY = Math.max(maxY, y + nodeHeight);
    });

    // Add padding
    const padding = 4;
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }, [reactFlowInstance, currentSelection.nodeIds, nodes]);

  // Handle mouse down on selection box
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0 || !box || currentSelection.nodeIds.length === 0) {
        return;
      }

      // Don't handle if clicking on a node (let node handle its own drag)
      const target = e.target as HTMLElement;
      if (target.closest(".react-flow__node")) {
        return;
      }

      // Check if clicking inside the selection box
      if (!reactFlowInstance) return;

      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const isInsideBox =
        flowPosition.x >= box.x &&
        flowPosition.x <= box.x + box.width &&
        flowPosition.y >= box.y &&
        flowPosition.y <= box.y + box.height;

      if (!isInsideBox) return;

      e.preventDefault();
      e.stopPropagation();

      // Get all selected nodes and their initial positions
      const nodes = reactFlowInstance.getNodes();
      const selectedNodes = nodes.filter((node) =>
        currentSelection.nodeIds.includes(node.id)
      );

      const nodePositions = new Map<string, { x: number; y: number }>();
      selectedNodes.forEach((node) => {
        nodePositions.set(node.id, { x: node.position.x, y: node.position.y });
      });

      dragStartRef.current = {
        x: flowPosition.x,
        y: flowPosition.y,
        nodePositions,
      };

      setIsDragging(true);
    },
    [box, currentSelection.nodeIds, reactFlowInstance]
  );

  // Handle mouse move to drag all selected nodes
  useEffect(() => {
    if (!isDragging || !dragStartRef.current || !reactFlowInstance) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;

      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      const deltaX = flowPosition.x - dragStartRef.current.x;
      const deltaY = flowPosition.y - dragStartRef.current.y;

      // Update local state only (preview) - use setNodes to update ReactFlow's internal state
      const currentNodes = reactFlowInstance.getNodes();
      const updatedNodes = currentNodes.map((node) => {
        if (dragStartRef.current?.nodePositions.has(node.id)) {
          const initialPos = dragStartRef.current.nodePositions.get(node.id)!;
          return {
            ...node,
            position: {
              x: initialPos.x + deltaX,
              y: initialPos.y + deltaY,
            },
          };
        }
        return node;
      });

      reactFlowInstance.setNodes(updatedNodes);
    };

    const handleMouseUp = () => {
      if (!dragStartRef.current || !reactFlowInstance) {
        setIsDragging(false);
        dragStartRef.current = null;
        return;
      }

      // Get final node positions and save to Liveblocks
      const currentNodes = reactFlowInstance.getNodes();
      const nodeChanges = currentNodes
        .filter((node) => dragStartRef.current?.nodePositions.has(node.id))
        .map((node) => ({
          id: node.id,
          type: "position" as const,
          position: node.position,
        }));

      if (nodeChanges.length > 0) {
        updateNodes(nodeChanges);
      }

      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, reactFlowInstance, updateNodes]);

  return useMemo(
    () => ({
      box,
      isDragging,
      handleMouseDown,
    }),
    [box, isDragging, handleMouseDown]
  );
}
