"use client";

import { ReactNode, useEffect, useState } from "react";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react";
import { LiveMap, LiveObject, LsonObject } from "@liveblocks/client";

interface RoomProps {
  children: ReactNode;
  diagramId: string;
  fallback: NonNullable<ReactNode> | null;
}

export const Room = ({ children, diagramId, fallback }: RoomProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      throttle={16}
      preventUnsavedChanges
      lostConnectionTimeout={10000}
      backgroundKeepAliveTimeout={15 * 60 * 1000}
    >
      <RoomProvider
        id={diagramId}
        initialPresence={{
          cursor: null,
          selection: [],
        }}
        initialStorage={{
          nodes: new LiveMap<string, LiveObject<LsonObject>>(),
          edges: new LiveMap<string, LiveObject<LsonObject>>(),
          chatbotStatus: new LiveObject({ isBusy: false }),
        }}
      >
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  );
};
