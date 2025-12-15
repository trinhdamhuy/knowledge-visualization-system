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
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { Box } from "lucide-react";

export function DiagramCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const theme = useTheme();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);

  const { activeMode, setActiveMode, setSelectedNodeId } = useDiagramStore();

  // Use Liveblocks as single source of truth
  const { nodes, edges, updateNodes, updateEdges, addNewEdge, addNode } =
    useDiagramSync();

  // Track mouse position for create node mode
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Set default mode on mount
  useEffect(() => {
    setActiveMode(DiagramMode.Select);
  }, [setActiveMode]);

  const onNodeContextMenu = (event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      nodeId: node.id,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

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

      // Track mouse position for create node mode
      if (activeMode === DiagramMode.CreateNode) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    },
    [updateMyPresence, activeMode]
  );

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
    setMousePosition(null);
  }, [updateMyPresence]);

  // Handle click on pane to create node or deselect node
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      // Deselect node when clicking on pane
      setSelectedNodeId(null);

      if (activeMode !== DiagramMode.CreateNode || !reactFlowInstance.current)
        return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodeId = `node-${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type: "custom",
        position,
        width: 150,
        height: 50,
        data: {
          label: "New Node",
        },
      };

      addNode(newNode);
    },
    [activeMode, addNode, setSelectedNodeId]
  );

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
      onNodesChange={updateNodes}
      onEdgesChange={updateEdges}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onConnect={addNewEdge}
      onPaneClick={onPaneClick}
      onNodeClick={onNodeClick}
      panOnDrag={activeMode === DiagramMode.Select ? [2] : false}
      selectionOnDrag={activeMode === DiagramMode.Select}
      nodeTypes={{ custom: CustomNode }}
      onNodeContextMenu={onNodeContextMenu}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
    >
      <DiagramHeader />
      <DiagramToolBar />
      <DiagramNodeToolBar />
      <ChatBotPanel />
      <Background variant={BackgroundVariant.Dots} gap={32} size={1} />
      <CollaboratorCursors />
      <MiniMap
        position="bottom-left"
        maskColor="transparent"
        className="border-2 border-text-foreground rounded-md min-h-fit min-w-fit"
      />
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
      {/* Show Box icon when in create node mode */}
      {activeMode === DiagramMode.CreateNode && mousePosition && (
        <div
          style={{
            position: "fixed",
            left: mousePosition.x + 12,
            top: mousePosition.y - 12,
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          <Box size={16} />
        </div>
      )}
    </ReactFlow>
  );
}
