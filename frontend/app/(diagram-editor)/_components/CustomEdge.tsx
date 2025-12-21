import { memo, useMemo } from "react";
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  BaseEdge,
} from "@xyflow/react";
import { useSelf, useOthers } from "@liveblocks/react";

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  type = "default",
}: EdgeProps) {
  const currentUser = useSelf();
  const others = useOthers();

  // Check if edge is selected
  const isSelectedByCurrentUser = useMemo(() => {
    return (
      currentUser?.presence?.selectedObjectIds?.edgeIds?.includes(id) ?? false
    );
  }, [currentUser, id]);

  const selectingUsers = useMemo(() => {
    return others.filter((other) =>
      other.presence?.selectedObjectIds?.edgeIds?.includes(id)
    );
  }, [others, id]);

  const isSelected = isSelectedByCurrentUser || selectingUsers.length > 0;

  // Debug: log selection state (remove in production)
  // console.log(`Edge ${id} selected:`, isSelected, {
  //   isSelectedByCurrentUser,
  //   selectingUsers: selectingUsers.length,
  //   currentUserSelection: currentUser?.presence?.selectedObjectIds?.edgeIds,
  // });

  // Get ring color (using ring color from theme)
  // Use a visible blue color for ring
  const ringColor = "#3b82f6"; // blue color for ring

  // Get path based on edge type
  const [edgePath] = useMemo(() => {
    switch (type) {
      case "straight":
        return getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        });
      case "step":
        return getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 0,
        });
      case "smoothstep":
        return getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
      case "default":
      case "simplebezier":
      default:
        return getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });
    }
  }, [
    type,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  ]);

  // Base edge style
  const baseStrokeWidth = Number(style.strokeWidth) || 1;
  const baseEdgeStyle = {
    ...style,
    strokeWidth: String(baseStrokeWidth),
  };

  // Ring style (medium, ring color) - render in middle
  const middleRingStyle = {
    stroke: ringColor,
    strokeWidth: String(baseStrokeWidth + 3), // +3px for Ring
    fill: "none",
    opacity: isSelected ? 0.5 : 0,
    transition: "opacity 0.2s",
    pointerEvents: "none" as const,
  };

  // Inner edge style (original) - render on top
  const innerEdgeStyle = {
    ...baseEdgeStyle,
    pointerEvents: "auto" as const,
  };

  return (
    <>
      {/* Ring - render in middle, always render but with opacity */}
      <BaseEdge
        path={edgePath}
        style={middleRingStyle}
        markerEnd={undefined} // No marker on rings
      />
      {/* Inner edge - always visible, render on top */}
      <BaseEdge path={edgePath} style={innerEdgeStyle} markerEnd={markerEnd} />
    </>
  );
}

export default memo(CustomEdge);
