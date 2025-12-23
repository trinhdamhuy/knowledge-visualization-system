"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useUpdateNodeInternals,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "../style.css";
import { useDiagramStore } from "../_stores/use-diagram-store";
import CustomNode from "./CustomNode";
import SimpleFloatingEdge from "./SimpleFloatingEdge";
import { CollaboratorCursors } from "./CollaboratorCursors";
import { CombinedInteractionHandler } from "./CombinedInteractionHandler";
import { SelectionBox } from "./SelectionBox";
import { useSelectedNodesBox } from "./hooks/use-selected-nodes-box";
import { useHashNavigation } from "./hooks/use-hash-navigation";
import { usePdfPageParams } from "./hooks/use-pdf-page-params";
import { useUpdateMyPresence, useSelf } from "@liveblocks/react";
import { useTheme } from "next-themes";
import { DiagramMode } from "@/enums/modes";
import { useDiagramSync } from "@/hooks/use-diagram-sync";
import { Box } from "lucide-react";

type LayoutDirection = "TB" | "LR";

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

function UpdateNodeInternalsOnSignal({
  nodeIds,
  signal,
}: {
  nodeIds: string[];
  signal: number;
}) {
  // IMPORTANT: This hook must be used inside the ReactFlow provider tree.
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    if (!signal) return;
    nodeIds.forEach((id) => updateNodeInternals(id));
  }, [signal, nodeIds, updateNodeInternals]);

  return null;
}

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = "TB"
) {
  // generous spacing (tune as needed)
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 220,
    nodesep: 180,
    edgesep: 40,
  });

  nodes.forEach((node) => {
    const w = (node.width as number) ?? (node.measured?.width as number) ?? 150;
    const h =
      (node.height as number) ?? (node.measured?.height as number) ?? 50;
    dagreGraph.setNode(node.id, { width: w, height: h });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id) as {
      x: number;
      y: number;
    };
    const w = (node.width as number) ?? (node.measured?.width as number) ?? 150;
    const h =
      (node.height as number) ?? (node.measured?.height as number) ?? 50;

    return {
      ...node,
      // shift dagre (center-anchored) -> reactflow (top-left anchored)
      position: {
        x: nodeWithPosition.x - w / 2,
        y: nodeWithPosition.y - h / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
}

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

export function DiagramCanvas() {
  const updateMyPresence = useUpdateMyPresence();
  const theme = useTheme();
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Handle hash-based navigation for reference links
  useHashNavigation();

  // Handle pdf-page URL parameter to open FilePanel and navigate to page
  usePdfPageParams();

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
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>("TB");
  const layoutDirectionRef = useRef<LayoutDirection>("TB");
  const [internalsUpdateSignal, setInternalsUpdateSignal] = useState(0);
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

  // Listen for focus-node events from ReferenceLink
  useEffect(() => {
    const handleFocusNode = (event: CustomEvent<{ nodeId: string }>) => {
      if (!reactFlowInstance.current) return;

      const { nodeId } = event.detail;
      const node = reactFlowInstance.current.getNode(nodeId);

      if (!node) {
        console.warn(`Node ${nodeId} not found`);
        return;
      }

      // Focus on the node
      reactFlowInstance.current.fitView({
        nodes: [node],
        padding: 0.2,
        duration: 500,
      });
    };

    window.addEventListener("focus-node", handleFocusNode as EventListener);

    return () => {
      window.removeEventListener(
        "focus-node",
        handleFocusNode as EventListener
      );
    };
  }, []);

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
      const isHorizontal = layoutDirection === "LR";
      const newNode: Node = {
        id: newNodeId,
        type: "custom",
        position,
        width: 150,
        height: 50,
        data: {
          label: "New Node",
          // Only 2 handle modes supported
          targetHandlePosition: isHorizontal ? "left" : "top",
          sourceHandlePosition: isHorizontal ? "right" : "bottom",
        },
      };

      addNode(newNode);
    },
    [activeMode, addNode, updateMyPresence, handlers, layoutDirection]
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

  // Zoom limits (optional)
  const minZoom = 0.1; // Minimum zoom level (10%)
  const maxZoom = 2; // Maximum zoom level (200%)

  const allNodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  const applyLayout = useCallback(
    (direction: LayoutDirection) => {
      if (isAnyDragging) return;
      if (nodes.length === 0) return;

      const { nodes: layoutedNodes } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      // update local immediately for responsiveness
      setLocalNodes(layoutedNodes);

      // persist positions
      const positionChanges: NodeChange[] = layoutedNodes.map((node) => ({
        id: node.id,
        type: "position" as const,
        position: node.position,
      }));
      updateNodes(positionChanges);

      // IMPORTANT: notify React Flow (inside provider) to recalc internals & reposition handles/edges
      setTimeout(() => {
        setInternalsUpdateSignal((s) => s + 1);
      }, 50);

      setLayoutDirection(direction);
      layoutDirectionRef.current = direction;

      // Notify UI (PropertiesPanel) that layout mode changed
      window.dispatchEvent(
        new CustomEvent("diagram-layout-changed", { detail: { direction } })
      );
    },
    [isAnyDragging, nodes, edges, updateNodes, setLocalNodes]
  );

  // Allow UI (PropertiesPanel) to trigger dagre layout
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ direction?: LayoutDirection | "TOGGLE" }>;
      const dir = ev.detail?.direction;
      if (!dir) return;
      const next =
        dir === "TOGGLE"
          ? layoutDirectionRef.current === "TB"
            ? "LR"
            : "TB"
          : dir;
      applyLayout(next);
    };

    window.addEventListener("diagram-apply-layout", handler as EventListener);
    return () => {
      window.removeEventListener(
        "diagram-apply-layout",
        handler as EventListener
      );
    };
  }, [applyLayout]);

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
        default: SimpleFloatingEdge,
        straight: SimpleFloatingEdge,
        step: SimpleFloatingEdge,
        smoothstep: SimpleFloatingEdge,
        simplebezier: SimpleFloatingEdge,
        custom: SimpleFloatingEdge,
      }}
      onNodeContextMenu={onNodeContextMenu}
      onInit={(instance) => (reactFlowInstance.current = instance)}
      nodesDraggable={true}
      nodesConnectable={true}
      elementsSelectable={false}
      selectNodesOnDrag={false}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <DiagramHeader />
      <DiagramToolBar />
      <PropertiesPanel />
      <UpdateNodeInternalsOnSignal
        nodeIds={allNodeIds}
        signal={internalsUpdateSignal}
      />
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
