import { memo, useMemo, useState, useRef, useEffect } from "react";
import {
  EdgeProps,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  BaseEdge,
  useReactFlow,
} from "@xyflow/react";
import { useSelf, useOthers } from "@liveblocks/react";
import { getUserColor } from "./utils/user-colors";
import { DiagramMode } from "@/enums/modes";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { useTheme } from "next-themes";

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
  data,
}: EdgeProps) {
  const currentUser = useSelf();
  const others = useOthers();
  const { updateEdge } = useReactFlow();
  const { setActiveMode } = useDiagramStore();
  const { resolvedTheme } = useTheme();

  const edgeData = data as
    | {
        label?: string;
        labelFontFamily?: string;
        labelFontSize?: number;
        labelColor?: string;
      }
    | undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check if edge is selected
  const isSelectedByCurrentUser = useMemo(() => {
    return (
      currentUser?.presence?.selectedObjectIds?.edgeIds?.includes(id) ?? false
    );
  }, [currentUser, id]);

  const selectingUsers = useMemo(() => {
    return others
      .filter((other) =>
        other.presence?.selectedObjectIds?.edgeIds?.includes(id)
      )
      .map((other) => ({
        connectionId: other.connectionId,
        color: getUserColor(other.connectionId),
      }));
  }, [others, id]);

  // Get ring color for current user selection
  const currentUserRingColor = "#3b82f6"; // blue color for current user

  // Auto-focus and resize textarea when editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentLabel = edgeData?.label || "";
    setEditingLabel(currentLabel);
    setIsEditing(true);
    setActiveMode(DiagramMode.Select);
  };

  const handleBlur = () => {
    setTimeout(() => {
      try {
        const toolbar = document.querySelector("[data-text-toolbar]");
        const active = document.activeElement as HTMLElement | null;
        if (toolbar && active && toolbar.contains(active)) {
          textareaRef.current?.focus();
          return;
        }
      } catch (e) {
        console.error(e);
      }

      setIsEditing(false);
      setActiveMode(DiagramMode.Select);
      updateEdge(id, {
        data: {
          ...edgeData,
          label: editingLabel.trim(),
        },
      });
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  // Get path based on edge type
  const [edgePath, labelX, labelY] = useMemo(() => {
    let path: string;
    switch (type) {
      case "straight":
        path = getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        })[0];
        break;
      case "step":
        path = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 0,
        })[0];
        break;
      case "smoothstep":
        path = getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })[0];
        break;
      case "default":
      case "simplebezier":
      default:
        path = getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        })[0];
        break;
    }

    // Calculate label position (middle of the edge)
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    return [path, labelX, labelY];
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

  // Ring style for current user (middle ring) - smaller strokeWidth
  const currentUserRingStyle = {
    stroke: currentUserRingColor,
    strokeWidth: String(baseStrokeWidth + 2), // +2px for middle ring
    fill: "none",
    opacity: isSelectedByCurrentUser ? 0.5 : 0,
    transition: "opacity 0.2s",
    pointerEvents: "none" as const,
  };

  // Inner edge style (original) - render on top
  const innerEdgeStyle = {
    ...baseEdgeStyle,
    pointerEvents: "auto" as const,
  };

  // Label styles
  const labelFontFamily = edgeData?.labelFontFamily || "Inter";
  const labelFontSize = edgeData?.labelFontSize || 12;
  // Use custom labelColor if set, otherwise use theme-based color (default)
  // Default: black for light mode, white for dark mode
  const defaultLabelColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";
  const labelColor = edgeData?.labelColor || defaultLabelColor;

  const hasLabel = edgeData?.label !== undefined && edgeData.label !== "";

  return (
    <>
      {/* Inner edge - always visible, render first (bottom layer) */}
      <BaseEdge path={edgePath} style={innerEdgeStyle} markerEnd={markerEnd} />
      {/* Ring for current user - middle ring (render after inner edge) */}
      <BaseEdge
        path={edgePath}
        style={currentUserRingStyle}
        markerEnd={undefined} // No marker on rings
      />
      {/* Rings for other users' selections - outside rings (render last, on top) */}
      {selectingUsers.map((user, index) => (
        <BaseEdge
          key={user.connectionId}
          path={edgePath}
          style={{
            stroke: user.color,
            strokeWidth: String(baseStrokeWidth + 4 + index * 2), // +4px for outside ring, offset each additional ring
            fill: "none",
            opacity: 0.5,
            transition: "opacity 0.2s",
            pointerEvents: "none" as const,
          }}
          markerEnd={undefined} // No marker on rings
        />
      ))}

      {/* Invisible clickable area for adding label when no label exists */}
      {!hasLabel && !isEditing && (
        <g
          transform={`translate(${labelX}, ${labelY})`}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "pointer", pointerEvents: "auto" }}
        >
          <rect x={-30} y={-10} width={60} height={20} fill="transparent" />
        </g>
      )}

      {/* Edge Label */}
      {(hasLabel || isEditing) && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          {isEditing ? (
            <>
              {/* Background for label when editing */}
              <rect
                x={-40}
                y={-12}
                width={80}
                height={24}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1"
                rx="4"
                style={{ pointerEvents: "none" }}
              />
              <foreignObject
                x={-40}
                y={-12}
                width={80}
                height={24}
                style={{ overflow: "visible" }}
              >
                <textarea
                  ref={textareaRef}
                  value={editingLabel}
                  onChange={(e) => {
                    setEditingLabel(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="nodrag nopan"
                  style={{
                    width: "100%",
                    minWidth: 50,
                    textAlign: "center",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: labelColor,
                    resize: "none",
                    overflow: "hidden",
                    lineHeight: "1.5",
                    wordWrap: "break-word",
                    whiteSpace: "pre-wrap",
                    padding: "2px 4px",
                    fontFamily: labelFontFamily,
                    fontSize: `${labelFontSize}px`,
                  }}
                />
              </foreignObject>
            </>
          ) : (
            <>
              {/* Background for label */}
              <rect
                x={-30}
                y={-10}
                width={60}
                height={20}
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1"
                rx="4"
                style={{ pointerEvents: "none" }}
              />
              <text
                x={0}
                y={0}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={labelColor}
                fontFamily={labelFontFamily}
                fontSize={labelFontSize}
                onDoubleClick={handleDoubleClick}
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  pointerEvents: "auto",
                }}
              >
                {edgeData?.label}
              </text>
            </>
          )}
        </g>
      )}
    </>
  );
}

export default memo(CustomEdge);
