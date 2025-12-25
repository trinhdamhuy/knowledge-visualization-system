export const runtime = "nodejs";

import { Liveblocks } from "@liveblocks/node";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDiagramRole } from "@/app/_actions/diagram/permission";
import { Permission } from "@/generated/prisma/client";

/**
 * Convert application Permission to Liveblocks room permissions
 * @param permission - Application permission (OWNER, EDITOR, VIEWER, or null)
 * @returns Array of Liveblocks room permissions
 */
function getLiveblocksPermissions(permission: Permission | null): string[] {
  if (!permission) {
    return []; // No access
  }

  switch (permission) {
    case Permission.OWNER:
      return ["room:read", "room:write", "room:admin"];
    case Permission.EDITOR:
      return ["room:read", "room:write"];
    case Permission.VIEWER:
      return ["room:read"];
    default:
      return [];
  }
}

export async function POST(request: NextRequest) {
  const liveblocksSecretKey = process.env.LIVEBLOCKS_SECRET_KEY!;

  if (!liveblocksSecretKey) {
    throw new Error("Missing Liveblocks Secret Key");
  }

  const liveblocks = new Liveblocks({ secret: liveblocksSecretKey });

  try {
    const authSession = await auth();
    const { room } = await request.json();

    if (!room) {
      return NextResponse.json({ error: "No room specified" }, { status: 400 });
    }

    // If user is not authenticated, check if room is public (has defaultAccesses)
    if (!authSession?.user?.id) {
      try {
        const roomInfo = await liveblocks.getRoom(room);

        // Check if room has defaultAccesses (public access)
        if (roomInfo?.defaultAccesses && roomInfo.defaultAccesses.length > 0) {
          // Room is public - allow anonymous access with default permissions
          const defaultAccesses = Array.isArray(roomInfo.defaultAccesses)
            ? roomInfo.defaultAccesses
            : [];

          // Create anonymous session
          const anonymousId = `anonymous-${Date.now()}-${Math.random()
            .toString(36)
            .substring(7)}`;
          const liveblocksSession = liveblocks.prepareSession(anonymousId, {
            userInfo: {
              name: "Anonymous",
              avatar: "",
            },
          });

          // Grant permissions based on defaultAccesses
          const hasWrite = defaultAccesses.some(
            (perm: string) => perm === "room:write"
          );
          const hasRead = defaultAccesses.some(
            (perm: string) => perm === "room:read"
          );

          if (hasWrite) {
            // Edit access
            liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
          } else if (hasRead) {
            // View access
            liveblocksSession.allow(room, liveblocksSession.READ_ACCESS);
          } else {
            // No access even though defaultAccesses exists
            return NextResponse.json(
              {
                error:
                  "Forbidden: You don't have permission to access this room",
              },
              { status: 403 }
            );
          }

          // Authorize and return response
          const { status, body } = await liveblocksSession.authorize();
          return new Response(body, { status });
        } else {
          // Room is not public - require authentication
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      } catch (error) {
        console.error("Error checking room access:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // User is authenticated - proceed with normal permission check
    const userId = authSession.user.id!;
    const userName = authSession.user.name ?? "Anonymous";
    const userImage = authSession.user.image ?? "";

    // Check user's permission for this diagram (room)
    // Room is private by default - only owner has access unless explicitly shared
    const userRole = await getDiagramRole(room);

    if (!userRole) {
      // User has no permission to access this room
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to access this room" },
        { status: 403 }
      );
    }

    // Get Liveblocks permissions based on user role
    const roomPermissions = getLiveblocksPermissions(userRole);

    // Create Liveblocks session with user info
    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: userName,
        avatar: userImage,
      },
    });

    // Grant permissions based on user role
    // Room is private by default - permissions are granted based on role
    if (roomPermissions.includes("room:admin")) {
      // OWNER - full access
      liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
    } else if (roomPermissions.includes("room:write")) {
      // EDITOR - read and write access
      liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
    } else if (roomPermissions.includes("room:read")) {
      // VIEWER - read-only access
      liveblocksSession.allow(room, liveblocksSession.READ_ACCESS);
    } else {
      // No access
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to access this room" },
        { status: 403 }
      );
    }

    // Authorize and return response
    const { status, body } = await liveblocksSession.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Error in POST /liveblocks-auth:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
