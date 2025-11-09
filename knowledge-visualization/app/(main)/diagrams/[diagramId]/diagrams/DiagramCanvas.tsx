"use client";

import { useCallback, useState } from "react";
import { useUpdateMyPresence } from "@/lib/liveblocks.config";
import { CollaborationCursors } from "./CollaborationCursors";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Controls,
  Background,
  NodeChange,
  EdgeChange,
  Connection,
  BackgroundVariant,
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ChatBotPanel } from "./ChatBotPanel";

const initialNodes: Node[] = [
  { id: "n1", position: { x: 0, y: 0 }, data: { label: "Node 1" } },
  { id: "n2", position: { x: 0, y: 100 }, data: { label: "Node 2" } },
];
const initialEdges: Edge[] = [{ id: "n1-n2", source: "n1", target: "n2" }];

export function DiagramCanvas() {
  const updateMyPresence = useUpdateMyPresence();

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const current = e.currentTarget;
      const rect = current.getBoundingClientRect();

      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);

      updateMyPresence({ cursor: { x, y } });
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
    <main className="h-screen w-screen relative bg-white touch-none overflow-hidden">
      <DiagramHeader />

      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
        <DiagramToolBar />
      </div>

      <div
        style={{ width: "100vw", height: "100vh" }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      <div className="h-full w-full absolute inset-0 pointer-events-none">
        <CollaborationCursors />
      </div>

      <ChatBotPanel />
    </main>
  );
}
