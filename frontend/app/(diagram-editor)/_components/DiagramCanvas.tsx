"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import { PropertiesPanel } from "./PropertiesPanel";
import { NodeContextMenu } from "./NodeContextMenu";
import {
  ReactFlow,
  Background,
  MiniMap,
  Node,
  Edge,
  ReactFlowInstance,
  BackgroundVariant,
} from "@xyflow/react";
import "../style.css";
import { useDiagramStore } from "../_stores/use-diagram-store";
import CustomNode from "./CustomNode";
import { CollaboratorCursors } from "./CollaboratorCursors";
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

  const { activeMode, setActiveMode, setSelection } = useDiagramStore();

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

  const { selectedObjectIds } = useDiagramStore();
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select logic: toggle node in array
        if (selectedObjectIds.nodeIds.includes(node.id)) {
          setSelection(
            selectedObjectIds.nodeIds.filter((id) => id !== node.id),
            [] // Clear edge selection when selecting nodes
          );
        } else {
          setSelection(
            [...selectedObjectIds.nodeIds, node.id],
            [] // Clear edge selection when selecting nodes
          );
        }
      } else {
        setSelection([node.id], []); // Clear edge selection when selecting nodes
      }
    },
    [selectedObjectIds.nodeIds, setSelection]
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
      // Deselect both nodes and edges when clicking on pane
      setSelection([], []);

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
    [activeMode, addNode, setSelection]
  );

  const onSelectionChange = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      // Use setSelection to set both nodes and edges without clearing each other
      setSelection(
        params.nodes.map((n) => n.id),
        params.edges.map((e) => e.id)
      );
    },
    [setSelection]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select logic: toggle edge in array
        const currentSelected =
          useDiagramStore.getState().selectedObjectIds.edgeIds;
        if (currentSelected.includes(edge.id)) {
          setSelection(
            [], // Clear node selection when selecting edges
            currentSelected.filter((id) => id !== edge.id)
          );
        } else {
          setSelection(
            [], // Clear node selection when selecting edges
            [...currentSelected, edge.id]
          );
        }
      } else {
        setSelection([], [edge.id]); // Clear node selection when selecting edges
      }
    },
    [setSelection]
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
      proOptions={{ hideAttribution: true }}
      nodes={nodes}
      edges={edges}
      onNodesChange={updateNodes}
      onEdgesChange={updateEdges}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onConnect={addNewEdge}
      onPaneClick={onPaneClick}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onSelectionChange={onSelectionChange}
      panOnDrag={activeMode === DiagramMode.Select ? [2] : false}
      selectionOnDrag={activeMode === DiagramMode.Select}
      nodeTypes={{ custom: CustomNode }}
      onNodeContextMenu={onNodeContextMenu}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={true}
      selectNodesOnDrag={activeMode === DiagramMode.Select}
    >
      <DiagramHeader />
      <DiagramToolBar />
      <PropertiesPanel />
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
