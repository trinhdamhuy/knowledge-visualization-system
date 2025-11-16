"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import { DiagramNodeToolBar } from "./DiagramNodeToolBar";
import { NodeContextMenu } from "./NodeContextMenu";
import {
  ReactFlow,
  Background,
  MiniMap,
  Node,
  ReactFlowInstance,
  BackgroundVariant,
} from "@xyflow/react";
import "../style.css";
import { useDiagramStore } from "../_stores/use-diagram-store";
import CustomNode from "./CustomNode";
import { CollaboratorCursors } from "./CollaboratorCursors";
import { ChatBotPanel } from "./ChatBotPanel";
import { useUpdateMyPresence } from "@liveblocks/react";
import { useTheme } from "next-themes";
import { DiagramMode } from "@/enums/modes";

export function DiagramCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const theme = useTheme();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);

  const {
    nodes,
    edges,
    activeMode,
    initialize,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setSelectedNodeId,
    setActiveMode,
  } = useDiagramStore();

  useEffect(() => {
    setActiveMode(DiagramMode.Select);
    initialize([], []);
  }, [initialize, setActiveMode]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      nodeId: node.id,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      updateMyPresence({
        cursor: { x: Math.round(position.x), y: Math.round(position.y) },
      });
    },
    [updateMyPresence]
  );

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);
  return (
    <ReactFlow
      colorMode={
        theme.resolvedTheme === "dark"
          ? "dark"
          : theme.theme === "light"
          ? "light"
          : "system"
      }
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onConnect={onConnect}
      fitView
      panOnDrag={activeMode === DiagramMode.Select ? [2] : false}
      selectionOnDrag={activeMode === DiagramMode.Select}
      nodeTypes={{ custom: CustomNode }}
      onNodeClick={onNodeClick}
      onNodeContextMenu={onNodeContextMenu}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
    >
      <DiagramHeader />

      <DiagramToolBar />
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <CollaboratorCursors />
      <MiniMap
        position="bottom-left"
        maskColor="transparent"
        className="border-2 border-text-foreground rounded-md min-h-fit min-w-fit"
      />
      <ChatBotPanel />
      <DiagramNodeToolBar />
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </ReactFlow>
  );
}
