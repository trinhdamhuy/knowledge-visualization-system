import { LiveMap, LiveObject, LsonObject } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    Presence: {
      cursor: { x: number; y: number } | null;
      selectedObjectIds: {
        nodeIds: string[];
        edgeIds: string[];
      };
    };

    Storage: {
      nodes: LiveMap<string, LiveObject<LsonObject>>;
      edges: LiveMap<string, LiveObject<LsonObject>>;
      chatbotStatus: LiveObject<{
        isBusy: boolean;
      }>;
    };

    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
      };
    };
  }
}
export {};
