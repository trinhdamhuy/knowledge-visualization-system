"use client";

import { useCallback, useEffect, useState } from "react";
import { Node } from "@xyflow/react";
import { useDiagramStore } from "../_store/use-diagram-store";

interface ContextMenuProps {
  nodeId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function NodeContextMenu({ nodeId, position, onClose }: ContextMenuProps) {
  const { nodes, edges, addNodeWithEdge } = useDiagramStore();

  useEffect(() => {
    const handleClick = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

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
      
      const extendCount = edges.filter((e) => e.source === currentNode.id).length;
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
          y: parentNode.position.y + (childrenCount * 80) - (childrenCount * 40),
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

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 10000,
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "200px",
        padding: "4px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <button
        onClick={handleAddChild}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: "14px",
          textAlign: "left",
          borderRadius: "4px",
          transition: "background 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span>Add child</span>
        <span
          style={{
            color: "#9ca3af",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          TAB
        </span>
      </button>
    </div>
  );
}
