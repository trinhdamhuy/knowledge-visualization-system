"use client";
import { useEffect, useRef } from "react";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import { DiagramNodeToolBar } from "./DiagramNodeToolBar";
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
import CustomNode from "./CustomNode";

const initialNodes: Node[] = [
  {
    id: "n1",
    type: "custom",
    position: { x: 0, y: 0 },
    data: { label: "New topic", color: "#FF97A7", shape: "rectangle" },
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
    setSelectedNodeId,
  } = useDiagramStore();

  useEffect(() => {
    if (nodes.length === 0 && edges.length === 0) {
      initialize(initialNodes, initialEdges);
    }
  }, [nodes.length, edges.length, initialize]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

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
      nodeTypes={{ custom: CustomNode }}
      onNodeClick={onNodeClick}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
    >
      <DiagramHeader />
      <DiagramToolBar reactFlowInstance={reactFlowInstance} />
      <Background />
      <MiniMap />
      <DiagramNodeToolBar />
    </ReactFlow>
  );
}
