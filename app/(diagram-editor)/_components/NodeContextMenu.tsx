"use client";

import { useCallback, useEffect } from "react";
import { Node } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useDiagramSync } from "@/hooks/use-diagram-sync";

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
  const { nodes, edges, addNodeWithEdge } = useDiagramSync();

  const handleAddChild = useCallback(() => {
    const parentNode = nodes.find((n) => n.id === nodeId);
    if (!parentNode) return;

    const childrenEdges = edges.filter((e) => e.source === nodeId);
    const childrenCount = childrenEdges.length;

    const isChildNode = edges.some((e) => e.target === nodeId);

    const hasGrandchildren = childrenEdges.some((edge) => {
      const childId = edge.target;
      return edges.some((e) => e.source === childId);
    });

    if (isChildNode && childrenCount > 0 && hasGrandchildren) {
      let currentNode = parentNode;
      let extendEdge = edges.find((e) => e.source === currentNode.id);

      while (extendEdge) {
        const nextNode = nodes.find((n) => n.id === extendEdge!.target);
        if (!nextNode) break;

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
        position: {
          x: currentNode.position.x + 150,
          y: currentNode.position.y,
        },
        type: "custom",
        width: 150,
        height: 50,
        data: {
          label: `New Topic 1`,
        },
      };

      const newEdge = {
        id: `e-${currentNode.id}-${newNodeId}`,
        type: "custom",
        source: currentNode.id,
        target: newNodeId,
      };

      addNodeWithEdge(newNode, newEdge);
    } else {
      const newNodeId = `${nodeId}-child-${childrenCount + 1}-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: "custom",
        position: {
          x: parentNode.position.x + 200,
          y: parentNode.position.y + childrenCount * 80 - childrenCount * 40,
        },
        width: 150,
        height: 50,
        data: {
          label: `New Topic ${childrenCount + 1}`,
        },
      };

      const newEdge = {
        id: `e-${nodeId}-${newNodeId}`,
        source: nodeId,
        target: newNodeId,
        type: "custom",
      };

      addNodeWithEdge(newNode, newEdge);
    }

    onClose();
  }, [nodeId, nodes, edges, addNodeWithEdge, onClose]);

  const options = [
    {
      label: "Add child",
      kbd: <Kbd>+</Kbd>,
      onClick: handleAddChild,
    },
    {
      label: "Copy node",
      kbd: (
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>C</Kbd>
        </KbdGroup>
      ),
      onClick: () => {
        console.log("Copy node");
      },
    },
  ];

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
      className="fixed bg-card text-card-foreground border rounded-lg shadow-lg max-w-[200px] p-1"
      style={{
        left: position.x,
        top: position.y,
        zIndex: 10000,
      }}
    >
      {options.map((option) => (
        <Button
          key={option.label}
          onClick={option.onClick}
          variant="ghost"
          className="w-full justify-between"
        >
          <span>{option.label}</span>
          {option.kbd}
        </Button>
      ))}
    </div>
  );
}
