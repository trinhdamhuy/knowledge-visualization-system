"use client";
import { useEffect, useRef } from "react";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import {
  ReactFlow,
  Background,
  MiniMap,
  Node,
  Edge,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDiagramStore } from "../_store/use-diagram-store";

const initialNodes: Node[] = [
  {
    id: "n1",
    position: { x: 0, y: 0 },
    data: { label: "Node 1" },
    draggable: false,
  },
];
const initialEdges: Edge[] = [];

export function DiagramCanvas() {
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);
  const {
    nodes,
    edges,
    mode,
    initialize,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useDiagramStore();

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      initialize(initialNodes, initialEdges);
    }
  }, [nodes.length, edges.length, initialize]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      panOnDrag={mode === "move"}
      selectionOnDrag={mode === "select"}
      onInit={(instance) => (reactFlowInstance.current = instance)}
    >
      <DiagramHeader />
      <DiagramToolBar reactFlowInstance={reactFlowInstance} />
      <Background />
      <MiniMap />
    </ReactFlow>
  );
}
