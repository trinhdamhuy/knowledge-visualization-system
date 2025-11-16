import { create } from 'zustand';
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

type DiagramState = {
  nodes: Node[];
  edges: Edge[];
  mode: 'move' | 'select';
  fullscreen: boolean;
  moveActive: boolean;
  selectActive: boolean;
};

type DiagramActions = {
  setNodes: (updater: Node[] | ((prev: Node[]) => Node[])) => void;
  setEdges: (updater: Edge[] | ((prev: Edge[]) => Edge[])) => void;
  setMode: (mode: 'move' | 'select') => void;
  setFullscreen: (fullscreen: boolean) => void;
  setMoveActive: (active: boolean) => void;
  setSelectActive: (active: boolean) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (conn: Connection) => void;
  initialize: (initialNodes: Node[], initialEdges: Edge[]) => void;
};

export const useDiagramStore = create<DiagramState & DiagramActions>((set, get) => ({
  nodes: [],
  edges: [],
  mode: 'move',
  fullscreen: false,
  moveActive: false,
  selectActive: false,

  setNodes: (updater) =>
    set((s) => ({ 
      nodes: typeof updater === 'function' ? updater(s.nodes) : updater 
    })),

  setEdges: (updater) =>
    set((s) => ({ 
      edges: typeof updater === 'function' ? updater(s.edges) : updater 
    })),

  setMode: (mode) => set({ mode }),
  setFullscreen: (fullscreen) => set({ fullscreen }),
  setMoveActive: (active) => set({ moveActive: active }),
  setSelectActive: (active) => set({ selectActive: active }),

  onNodesChange: (changes: NodeChange[]) => {
    const { nodes } = get();
    const newNodes = applyNodeChanges(changes, nodes);
    set({ nodes: newNodes });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const { edges } = get();
    const newEdges = applyEdgeChanges(changes, edges);
    set({ edges: newEdges });
  },

  onConnect: (conn: Connection) => {
    const { edges } = get();
    const newEdges = addEdge(conn, edges);
    set({ edges: newEdges });
  },

  initialize: (initialNodes, initialEdges) =>
    set({ nodes: initialNodes, edges: initialEdges }),
}));
