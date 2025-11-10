"use client";

import { memo } from "react";
import { useReactFlow } from "@xyflow/react";
import { useOther, useOthersConnectionIds } from "@liveblocks/react/suspense";

const Cursor = memo(({ connectionId }: { connectionId: number }) => {
  const info = useOther(connectionId, (user) => user?.info);
  const cursor = useOther(connectionId, (user) => user?.presence?.cursor);
  const { flowToScreenPosition } = useReactFlow();

  const name = info?.name || "Anonymous";

  if (!cursor) {
    return null;
  }

  // Convert canvas coordinates to screen coordinates for display
  const screenPosition = flowToScreenPosition({
    x: cursor.x,
    y: cursor.y,
  });

  const { x, y } = screenPosition;

  const colors = [
    "rgb(59, 130, 246)", // blue
    "rgb(236, 72, 153)", // pink
    "rgb(34, 197, 94)", // green
    "rgb(251, 146, 60)", // orange
    "rgb(168, 85, 247)", // purple
  ];

  const color = colors[connectionId % colors.length];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        transform: `translate(${x}px, ${y}px)`,
        transition: "transform 0.12s cubic-bezier(0.17, 0.93, 0.38, 1)",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
        }}
      >
        <path
          d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Name label */}
      <div
        style={{
          position: "absolute",
          left: "7px",
          top: "18px",
          backgroundColor: color,
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          fontWeight: 600,
          color: "white",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        }}
      >
        {name}
      </div>
    </div>
  );
});

Cursor.displayName = "Cursor";

export const CollaboratorCursors = memo(() => {
  const ids = useOthersConnectionIds();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      {ids.map((connectionId) => (
        <Cursor key={connectionId} connectionId={connectionId} />
      ))}
    </div>
  );
});

CollaboratorCursors.displayName = "CollaboratorCursors";
