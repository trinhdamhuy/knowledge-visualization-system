"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { LiveMap, LiveObject } from "@liveblocks/client";

interface RoomProps {
  children: ReactNode;
  diagramId: string;
  fallback: NonNullable<ReactNode> | null;
}

interface SafeNode {
  [key: string]: any;
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

interface SafeEdge {
  [key: string]: any;
  id: string;
  source: string;
  target: string;
  type?: string;
  arrowHeadType?: string;
  label?: string;
  animated?: boolean;
}

export const Room = ({ children, diagramId, fallback }: RoomProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const authenticate = async () => {
      try {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: diagramId }),
        });
        setIsAuthenticated(response.ok);
      } catch (error) {
        console.error("Error authenticating:", error);
        setIsAuthenticated(false);
      }
    };

    authenticate();
  }, [diagramId]);

  if (!isAuthenticated) {
    return fallback;
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth" throttle={16}>
      <RoomProvider
        id={diagramId}
        initialPresence={{
          cursor: null,
          selection: [],
          pencilDraft: null,
          penColor: null,
        }}
        initialStorage={{
          nodes: new LiveMap<string, LiveObject<SafeNode>>(),
          edges: new LiveMap<string, LiveObject<SafeEdge>>(),
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
};
