import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 100,
});

// Types
type Presence = {
  cursor: { x: number; y: number } | null;
  selection: string[];
};

type Storage = {
  nodes: any[];
  edges: any[];
};

type UserMeta = {
  id: string;
  info: {
    name: string;
    avatar: string;
  };
};

export const {
  suspense: {
    RoomProvider,
    useUpdateMyPresence,
    useOthers,
    useOthersConnectionIds,
    useOther,
    useSelf,
  },
} = createRoomContext<Presence, Storage, UserMeta>(client);
