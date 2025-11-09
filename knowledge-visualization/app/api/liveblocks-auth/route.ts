export const runtime = "nodejs";

import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const liveblocksSecretKey = process.env.LIVEBLOCKS_SECRET_KEY;

if (!liveblocksSecretKey) {
  throw new Error("Missing Liveblocks Secret Key");
}

const liveblocks = new Liveblocks({ secret: liveblocksSecretKey });

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id!;
    const userName = session.user.name ?? "Anonymous";
    const userImage = session.user.image ?? "";

    const { room } = await request.json();
    if (!room) {
      return NextResponse.json({ error: "No room specified" }, { status: 400 });
    }

    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        avatar: userImage,
      },
    });

    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

    const { status, body } = await liveblocksSession.authorize();

    return new Response(body, { status });
  } catch (error) {
    console.error("Error in POST /liveblocks-auth:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
