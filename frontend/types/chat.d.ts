// Types for chat API based on backend schemas

import { Json } from "@liveblocks/client";
import { Edge, Node } from "@xyflow/react";

export interface MindmapData {
  nodes: Node[] | Record<string, Node>;
  edges: Edge[] | Record<string, Edge>;
}

export interface BaseMessage {
  content: string | Array<string | object>; // content of the message, written in markdown format
  additional_kwargs?: Record<string, Json>; // additional kwargs for the message, known contained fields are: user_id, mindmap_data
  response_metadata?: Record<string, Json>;
  type: string; // ai, human
  name?: string | null; // if name = mindmap, then it contains a mindmap data
  id?: string | null;
}

export interface BaseResponse {
  status: 200 | 400 | 500;
  message: string;
}

export interface HistoryResponse {
  status: 200 | 400 | 500;
  messages?: BaseMessage[];
  has_more?: boolean;
  total?: number;
}

export interface ChatRequest {
  user_id: string;
  diagram_id: string;
  mode: "generate" | "chat";
  file_url?: string | null;
  messages?: BaseMessage[] | null;
  mindmap_data?: MindmapData | null;
  need_initialize_data?: boolean | null;
}

export interface DeleteRequest {
  diagram_id: string;
}
