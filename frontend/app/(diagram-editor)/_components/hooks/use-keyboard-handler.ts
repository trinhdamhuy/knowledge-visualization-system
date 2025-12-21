import { useEffect, useCallback, useMemo } from "react";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";
import { useDiagramSync } from "@/hooks/use-diagram-sync";

/**
 * Custom hook for handling keyboard shortcuts
 */
export function useKeyboardHandler() {
  const updateMyPresence = useUpdateMyPresence();
  const currentUser = useSelf();
  const { deleteNodesAndEdges, edges } = useDiagramSync();

  const currentSelection = useMemo(
    () =>
      currentUser?.presence?.selectedObjectIds ?? {
        nodeIds: [],
        edgeIds: [],
      },
    [currentUser?.presence?.selectedObjectIds]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle Backspace to delete selected nodes and edges
      if (e.key === "Backspace" || e.key === "Delete") {
        const { nodeIds, edgeIds } = currentSelection;

        if (nodeIds.length === 0 && edgeIds.length === 0) {
          return;
        }

        e.preventDefault();

        // Also delete edges connected to deleted nodes
        const connectedEdgeIds = edges
          .filter(
            (edge) =>
              nodeIds.includes(edge.source) || nodeIds.includes(edge.target)
          )
          .map((edge) => edge.id);

        // Combine all edge IDs (remove duplicates)
        const allEdgeIds = Array.from(
          new Set([...edgeIds, ...connectedEdgeIds])
        );

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
      }
    },
    [currentSelection, edges, deleteNodesAndEdges, updateMyPresence]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
