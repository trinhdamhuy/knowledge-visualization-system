"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DiagramHeader } from "./DiagramHeader";
import { DiagramToolBar } from "./DiagramToolBar";
import { PropertiesPanel } from "./PropertiesPanel";
import {
  ReactFlow,
  Background,
  MiniMap,
  Node,
  Edge,
  ReactFlowInstance,
  BackgroundVariant,
  NodeChange,
  applyNodeChanges,
} from "@xyflow/react";
import "../style.css";
import { useDiagramStore } from "../_stores/use-diagram-store";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { CollaboratorCursors } from "./CollaboratorCursors";
import { CombinedInteractionHandler } from "./CombinedInteractionHandler";
import { SelectionBox } from "./SelectionBox";
import { useSelectedNodesBox } from "./hooks/use-selected-nodes-box";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";

// Component wrapper to use hook inside ReactFlow context
function SelectedNodesBoxWrapper({
  onDragStart,
  onDragStop,
  onContextMenu,
}: {
  onDragStart?: () => void;
  onDragStop?: () => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}) {
  const { box, isDragging, handleMouseDown } = useSelectedNodesBox();

  // Notify parent when drag starts/stops
  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    } else {
      onDragStop?.();
    }
  }, [isDragging, onDragStart, onDragStop]);

  return (
    <SelectionBox
      selectedNodesBox={box}
      isDragging={isDragging}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
    />
  );
}
import { useTheme } from "next-themes";
import { DiagramMode } from "@/enums/modes";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { Box } from "lucide-react";

export function DiagramCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const theme = useTheme();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const { activeMode, setActiveMode } = useDiagramStore();
  const currentUser = useSelf();
  const currentSelection = currentUser?.presence?.selectedObjectIds ?? {
    nodeIds: [],
    edgeIds: [],
  };

  // Get interaction handlers from CombinedInteractionHandler
  const [handlers, setHandlers] = useState<{
    onNodeContextMenu: (event: React.MouseEvent, node: Node) => void;
    onEdgeContextMenu?: (event: React.MouseEvent, edge: Edge) => void;
    onPaneClick: (event: React.MouseEvent) => void;
    onPaneContextMenu?: (event: React.MouseEvent) => void;
    onPaneMouseDown?: (event: React.MouseEvent) => void;
  } | null>(null);

  // Use Liveblocks as single source of truth
  const { nodes, edges, updateNodes, updateEdges, addNewEdge, addNode } =
    useDiagramSync();

  // Local state for nodes during drag (preview only)
  const [localNodes, setLocalNodes] = useState<Node[]>(nodes);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingSelectionBox, setIsDraggingSelectionBox] = useState(false);
  const nodesFromLiveblocksRef = useRef<Node[]>(nodes);

  // Update ref when nodes change (for comparison)
  useEffect(() => {
    nodesFromLiveblocksRef.current = nodes;
  }, [nodes]);

  // Track if any drag is active (node drag or selection box drag)
  const isAnyDragging = isDragging || isDraggingSelectionBox;

  // Sync local nodes with Liveblocks nodes when not dragging
  // This ensures undo/redo works correctly by syncing with Liveblocks state
  // Using a separate effect to handle the sync after render
  useEffect(() => {
    if (!isAnyDragging) {
      // Use a small timeout to avoid setState during render
      const timeoutId = setTimeout(() => {
        setLocalNodes(nodesFromLiveblocksRef.current);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes, isAnyDragging]);

  // Track mouse position for create node mode
  const [mousePosition, setMousePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Set default mode on mount
  useEffect(() => {
    setActiveMode(DiagramMode.Select);
  }, [setActiveMode]);

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      handlers?.onNodeContextMenu(event, node);
    },
    [handlers]
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      // Convert to React.MouseEvent if needed
      const reactEvent = event as React.MouseEvent;
      reactEvent.preventDefault?.();
      if (handlers?.onPaneContextMenu) {
        handlers.onPaneContextMenu(reactEvent);
      }
    },
    [handlers]
  );

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
      // Call interaction handler to close context menu if open
      handlers?.onPaneClick(event);

      // Don't deselect if right-clicking (for pan)
      if (event.button === 2) return;

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
    [activeMode, addNode, updateMyPresence, handlers]
  );

  // Note: onSelectionChange is disabled since we use Presence for selection
  // ReactFlow's built-in selection is disabled via elementsSelectable={false}

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

  // Handle node changes - only update local state during drag, save to Liveblocks on drag stop
  const onNodesChangeLocal = useCallback(
    (changes: NodeChange[]) => {
      // Update local state for preview
      setLocalNodes((nds) => applyNodeChanges(changes, nds));

      // If not dragging (neither node drag nor selection box drag), save to Liveblocks immediately
      // (for non-drag changes like delete, add, etc.)
      if (!isAnyDragging) {
        updateNodes(changes);
      }
    },
    [isAnyDragging, updateNodes]
  );

  // Handle node drag start
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle node drag stop - save to Liveblocks
  const onNodeDragStop = useCallback(() => {
    if (isDragging && reactFlowInstance.current) {
      // Get current node positions from local state
      const currentNodes = reactFlowInstance.current.getNodes();
      const positionChanges: NodeChange[] = currentNodes.map((node) => ({
        id: node.id,
        type: "position" as const,
        position: node.position,
      }));

      // Save to Liveblocks
      updateNodes(positionChanges);
      setIsDragging(false);
    }
  }, [isDragging, updateNodes]);

  // Canvas boundaries configuration
  // translateExtent: Limits the area that can be panned (viewport movement)
  // Format: [[minX, minY], [maxX, maxY]] in flow coordinates
  // nodeExtent: Limits where nodes can be placed
  // Format: [[minX, minY], [maxX, maxY]] in flow coordinates
  const CANVAS_BOUNDARIES = {
    // Example: Limit canvas to 5000x5000 area
    // You can adjust these values based on your needs
    minX: -2000,
    minY: -2000,
    maxX: 5000,
    maxY: 5000,
  };

  const translateExtent: [[number, number], [number, number]] = [
    [CANVAS_BOUNDARIES.minX, CANVAS_BOUNDARIES.minY],
    [CANVAS_BOUNDARIES.maxX, CANVAS_BOUNDARIES.maxY],
  ];

  const nodeExtent: [[number, number], [number, number]] = [
    [CANVAS_BOUNDARIES.minX, CANVAS_BOUNDARIES.minY],
    [CANVAS_BOUNDARIES.maxX, CANVAS_BOUNDARIES.maxY],
  ];

  // Zoom limits (optional)
  const minZoom = 0.1; // Minimum zoom level (10%)
  const maxZoom = 2; // Maximum zoom level (200%)

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
      nodes={localNodes}
      edges={edges}
      onNodesChange={onNodesChangeLocal}
      onEdgesChange={updateEdges}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onConnect={addNewEdge}
      onPaneClick={onPaneClick}
      onPaneContextMenu={onPaneContextMenu}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      onEdgeContextMenu={(event, edge) => {
        handlers?.onEdgeContextMenu?.(event, edge);
      }}
      panOnDrag={false}
      selectionOnDrag={false}
      nodeTypes={{ custom: CustomNode }}
      edgeTypes={{
        default: CustomEdge,
        straight: CustomEdge,
        step: CustomEdge,
        smoothstep: CustomEdge,
        simplebezier: CustomEdge,
        custom: CustomEdge,
      }}
      onNodeContextMenu={onNodeContextMenu}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={false}
      selectNodesOnDrag={false}
      translateExtent={translateExtent}
      nodeExtent={nodeExtent}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <DiagramHeader />
      <DiagramToolBar />
      <PropertiesPanel />
      <Background variant={BackgroundVariant.Dots} gap={32} size={1} />
      <CollaboratorCursors />
      <CombinedInteractionHandler onHandlersReady={(h) => setHandlers(h)} />
      <SelectedNodesBoxWrapper
        onDragStart={() => setIsDraggingSelectionBox(true)}
        onDragStop={() => setIsDraggingSelectionBox(false)}
        onContextMenu={(event) => {
          // Open context menu when right-clicking on selection box
          handlers?.onPaneContextMenu?.(event);
        }}
      />
      <MiniMap
        pannable
        position="bottom-left"
        maskColor="transparent"
        className="border-2 border-text-foreground rounded-md min-h-fit min-w-fit"
      />
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
