"use client";

import { useCallback, useState, useRef } from "react";
import { useUpdateMyPresence } from "@/lib/liveblocks.config";
import { CollaboratorCursors } from "./CollaboratorCursors";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  NodeChange,
  EdgeChange,
  Connection,
  BackgroundVariant,
  Edge,
  Node,
  Position,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChatBotPanel } from "./ChatBotPanel";
import { useTheme } from "next-themes";

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const initialNodes: Node[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    data: { label: "Node 1" },
    ...nodeDefaults,
  },
  {
    id: "n2",
    position: { x: 200, y: 0 },
    data: { label: "Node 2" },
    ...nodeDefaults,
  },
];
const initialEdges: Edge[] = [{ id: "n1-n2", source: "n1", target: "n2" }];

export function DiagramCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const theme = useTheme();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

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

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes(
        (nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot) as Node[]
      ),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot: Edge[]) =>
        applyEdgeChanges(changes, edgesSnapshot)
      ),
    []
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot: Edge[]) => addEdge(params, edgesSnapshot)),
    []
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
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      onInit={onInit}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <DiagramHeader />
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
        <DiagramToolBar />
      </div>
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <CollaboratorCursors />

      <ChatBotPanel />
    </ReactFlow>
  );
}
