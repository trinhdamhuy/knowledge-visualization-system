import { Liveblocks } from "@liveblocks/node";

if (typeof window !== "undefined") {
  throw new Error("Liveblocks service should only be used on the server side");
}

const liveblocks = new Liveblocks({
  secret:
    "sk_prod_FnBVxnhHqxg4RSN1zvKMWpwL4OTTNBltGnhP_ltdeNZ657mx_vI7KjbvOsBcNgv4",
});

export { liveblocks };
