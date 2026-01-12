export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDiagramRole } from "@/app/_actions/diagram/permission";
import { Permission } from "@/generated/prisma/client";
import { getLiveblocks } from "@/lib/liveblocks";

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
  try {
    const liveblocks = getLiveblocks();
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

    // User is authenticated - check room defaultAccesses first, then database permission
    const userId = authSession.user.id!;
    const userName = authSession.user.name ?? "Anonymous";
    const userImage = authSession.user.image ?? "";

    // First, check if room is public (has defaultAccesses)
    let roomInfo;
    try {
      roomInfo = await liveblocks.getRoom(room);
    } catch (error) {
      console.error("Error getting room info:", error);
      roomInfo = undefined;
    }

    const hasDefaultAccesses =
      roomInfo?.defaultAccesses && roomInfo.defaultAccesses.length > 0;
    const defaultAccesses =
      hasDefaultAccesses && roomInfo
        ? Array.isArray(roomInfo.defaultAccesses)
          ? roomInfo.defaultAccesses
          : []
        : [];

    // Check user's permission for this diagram (room) from database
    const userRole = await getDiagramRole(room);

    // If user has database permission, use that (higher priority)
    if (userRole) {
      // User has permission from database - proceed with normal flow
    } else if (hasDefaultAccesses) {
      // User has no database permission, but room is public - use defaultAccesses
      // This allows authenticated users to access public rooms
      const hasWrite = defaultAccesses.some(
        (perm: string) => perm === "room:write"
      );
      const hasRead = defaultAccesses.some(
        (perm: string) => perm === "room:read"
      );

      if (hasWrite) {
        // Edit access from defaultAccesses
        const liveblocksSession = liveblocks.prepareSession(userId, {
          userInfo: {
            name: userName,
            avatar: userImage,
          },
        });
        liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);
        const { status, body } = await liveblocksSession.authorize();
        return new Response(body, { status });
      } else if (hasRead) {
        // View access from defaultAccesses
        const liveblocksSession = liveblocks.prepareSession(userId, {
          userInfo: {
            name: userName,
            avatar: userImage,
          },
        });
        liveblocksSession.allow(room, liveblocksSession.READ_ACCESS);
        const { status, body } = await liveblocksSession.authorize();
        return new Response(body, { status });
      } else {
        // No access even though defaultAccesses exists
        return NextResponse.json(
          {
            error: "Forbidden: You don't have permission to access this room",
          },
          { status: 403 }
        );
      }
    } else {
      // User has no permission to access this room (neither database nor public)
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
