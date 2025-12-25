"use server";

import { Liveblocks } from "@liveblocks/node";

if (typeof window !== "undefined") {
  throw new Error("Liveblocks service should only be used on the server side");
}

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export { liveblocks };
