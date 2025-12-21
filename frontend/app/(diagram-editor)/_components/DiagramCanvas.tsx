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
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";
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

  const { activeMode, setActiveMode } = useDiagramStore();
  const currentUser = useSelf();
  const currentSelection = currentUser?.presence?.selectedObjectIds ?? {
    nodeIds: [],
    edgeIds: [],
  };

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
    (event: React.MouseEvent, node: Node) => {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select logic: toggle node in array
        if (currentSelection.nodeIds.includes(node.id)) {
          updateMyPresence({
            selectedObjectIds: {
              nodeIds: currentSelection.nodeIds.filter((id) => id !== node.id),
              edgeIds: [], // Clear edge selection when selecting nodes
            },
          });
        } else {
          updateMyPresence({
            selectedObjectIds: {
              nodeIds: [...currentSelection.nodeIds, node.id],
              edgeIds: [], // Clear edge selection when selecting nodes
            },
          });
        }
      } else {
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: [node.id],
            edgeIds: [], // Clear edge selection when selecting nodes
          },
        });
      }
    },
    [currentSelection.nodeIds, updateMyPresence]
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
      updateMyPresence({
        selectedObjectIds: {
          nodeIds: [],
          edgeIds: [],
        },
      });

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
    [activeMode, addNode, updateMyPresence]
  );

  const onSelectionChange = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      // Update Presence with selected nodes and edges
      updateMyPresence({
        selectedObjectIds: {
          nodeIds: params.nodes.map((n) => n.id),
          edgeIds: params.edges.map((e) => e.id),
        },
      });
    },
    [updateMyPresence]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select logic: toggle edge in array
        if (currentSelection.edgeIds.includes(edge.id)) {
          updateMyPresence({
            selectedObjectIds: {
              nodeIds: [], // Clear node selection when selecting edges
              edgeIds: currentSelection.edgeIds.filter((id) => id !== edge.id),
            },
          });
        } else {
          updateMyPresence({
            selectedObjectIds: {
              nodeIds: [], // Clear node selection when selecting edges
              edgeIds: [...currentSelection.edgeIds, edge.id],
            },
          });
        }
      } else {
        updateMyPresence({
          selectedObjectIds: {
            nodeIds: [], // Clear node selection when selecting edges
            edgeIds: [edge.id],
          },
        });
      }
    },
    [currentSelection.edgeIds, updateMyPresence]
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
