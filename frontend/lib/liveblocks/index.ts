import { Liveblocks } from "@liveblocks/node";

if (typeof window !== "undefined") {
  throw new Error("Liveblocks service should only be used on the server side");
}

const liveblocks = new Liveblocks({
  secret:
    "sk_prod_8sLEy3p5YF-XRrnCF0H8TqIgUJVdvcKbhvOQl4hXH4zw6i3XMGWmuziPsNUQ7IUf",
});

export { liveblocks };
