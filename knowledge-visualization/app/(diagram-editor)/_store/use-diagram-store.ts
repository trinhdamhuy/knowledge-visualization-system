import { create } from "zustand";
import type {
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
} from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";

type ShapeType = "rectangle" | "circle";

type DiagramState = {
  nodes: Node[];
  edges: Edge[];
  mode: "move" | "select";
  fullscreen: boolean;
  moveActive: boolean;
  selectActive: boolean;
  selectedNodeId: string | null;
};

type DiagramActions = {
  setNodes: (updater: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (updater: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setMode: (mode: "move" | "select") => void;
  setFullscreen: (fullscreen: boolean) => void;
  setMoveActive: (active: boolean) => void;
  setSelectActive: (active: boolean) => void;
  setSelectedNodeId: (id: string | null) => void;
  setNodeColor: (id: string, color: string) => void;
  setNodeShape: (id: string, shape: ShapeType) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  initialize: (initialNodes: Node[], initialEdges: Edge[]) => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>(
  (set, get) => ({
    nodes: [],
    edges: [],
    mode: "move",
    fullscreen: false,
    moveActive: false,
    selectActive: false,
    selectedNodeId: null,

    setNodes: (updater) =>
      set((s) => ({
        nodes: typeof updater === "function" ? updater(s.nodes) : updater,
      })),
    setEdges: (updater) =>
      set((s) => ({
        edges: typeof updater === "function" ? updater(s.edges) : updater,
      })),
    setMode: (mode) => set({ mode }),
    setFullscreen: (fullscreen) => set({ fullscreen }),
    setMoveActive: (active) => set({ moveActive: active }),
    setSelectActive: (active) => set({ selectActive: active }),
    setSelectedNodeId: (id) => set({ selectedNodeId: id }),
    setNodeColor: (id, color) =>
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, color } } : n
        ),
      })),
    setNodeShape: (id, shape) =>
      set((s) => ({
        nodes: s.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, shape } } : n
        ),
      })),
    onNodesChange: (changes) => {
      const { nodes } = get();
      set({ nodes: applyNodeChanges(changes, nodes) });
    },
    onEdgesChange: (changes) => {
      const { edges } = get();
      set({ edges: applyEdgeChanges(changes, edges) });
    },
    onConnect: (conn) => {
      const { edges } = get();
      set({ edges: addEdge(conn, edges) });
    },
    initialize: (initialNodes, initialEdges) =>
      set({ nodes: initialNodes, edges: initialEdges }),
  })
);
