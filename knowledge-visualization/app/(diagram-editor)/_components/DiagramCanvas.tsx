"use client";
import { useEffect, useRef, useState } from "react";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import { DiagramNodeToolBar } from "./DiagramNodeToolBar";
import { NodeContextMenu } from "./NodeContextMenu";
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
import { ChatBotPanel } from "./ChatBotPanel";

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
  const [contextMenu, setContextMenu] = useState<{
    nodeId: string;
    position: { x: number; y: number };
  } | null>(null);
  
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

  useEffect(() => {
    console.log("Current nodes:", nodes);
    console.log("Current edges:", edges);
  }, [nodes, edges]);

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
      onNodeContextMenu={onNodeContextMenu}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
    >
      <DiagramHeader />
      <DiagramToolBar reactFlowInstance={reactFlowInstance} />
      <Background />
      <MiniMap position="bottom-left" />
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
