"use client";

import { useCallback, useEffect } from "react";
import { Node } from "@xyflow/react";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ContextMenuProps {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function NodeContextMenu({
  nodeId,
  position,
  onClose,
}: ContextMenuProps) {
  const { nodes, edges, addNodeWithEdge } = useDiagramStore();

  const handleAddChild = useCallback(() => {
    const parentNode = nodes.find((n) => n.id === nodeId);
    if (!parentNode) return;

    // Đếm số children hiện tại của node này
    const childrenEdges = edges.filter((e) => e.source === nodeId);
    const childrenCount = childrenEdges.length;

    // Kiểm tra xem node này có phải là child của node khác không (level 1+)
    const isChildNode = edges.some((e) => e.target === nodeId);

    // Kiểm tra xem node này đã có grandchildren chưa (children của children)
    const hasGrandchildren = childrenEdges.some((edge) => {
      const childId = edge.target;
      return edges.some((e) => e.source === childId);
    });

    // Nếu node này là child và đã có children, thì extend (kéo dài theo chiều ngang)
    if (isChildNode && childrenCount > 0 && hasGrandchildren) {
      // Tìm node cuối cùng trong chuỗi extend
      let currentNode = parentNode;
      let extendEdge = edges.find((e) => e.source === currentNode.id);

      while (extendEdge) {
        const nextNode = nodes.find((n) => n.id === extendEdge!.target);
        if (!nextNode) break;

        // Kiểm tra xem node này còn extend tiếp không
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
        type: "custom",
        position: {
          x: currentNode.position.x + 150,
          y: currentNode.position.y,
        },
        data: {
          label: `New Topic 1`,
          color: (currentNode.data.color as string) || "#FF97A7",
          shape: "rectangle",
        },
      };

      const newEdge = {
        id: `e-${currentNode.id}-${newNodeId}`,
        source: currentNode.id,
        target: newNodeId,
        type: "smoothstep",
        animated: false,
        style: { stroke: (currentNode.data.color as string) || "#FF97A7" },
      };

      addNodeWithEdge(newNode, newEdge);
    } else {
      const colors = ["#FF97A7", "#A78BFA", "#60A5FA", "#34D399", "#FBBF24"];
      const newNodeId = `${nodeId}-child-${childrenCount + 1}-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: "custom",
        position: {
          x: parentNode.position.x + 200,
          y: parentNode.position.y + childrenCount * 80 - childrenCount * 40,
        },
        data: {
          label: `New Topic ${childrenCount + 1}`,
          color: colors[childrenCount % colors.length],
          shape: "rectangle",
        },
      };

      const newEdge = {
        id: `e-${nodeId}-${newNodeId}`,
        source: nodeId,
        target: newNodeId,
        type: "smoothstep",
        animated: false,
        style: { stroke: colors[childrenCount % colors.length] },
      };

      addNodeWithEdge(newNode, newEdge);
    }

    onClose();
  }, [nodeId, nodes, edges, addNodeWithEdge, onClose]);

  useEffect(() => {
    const handleClick = () => onClose();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, handleAddChild]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bg-card text-card-foreground border rounded-lg shadow-lg min-w-[200px] p-1"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
    >
      <Button
        onClick={handleAddChild}
        variant="ghost"
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Plus />
          <span>Add child</span>
        </div>
      </Button>
    </div>
  );
}
