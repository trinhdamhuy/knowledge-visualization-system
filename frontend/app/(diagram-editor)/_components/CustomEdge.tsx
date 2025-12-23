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
        labelBackgroundColor?: string;
      }
    | undefined;

  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSavingRef = useRef(false);

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
    isSavingRef.current = false; // Reset saving flag when starting to edit
  };

  const saveLabel = () => {
    // Prevent multiple saves
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    const trimmedLabel = editingLabel.trim();
    const currentLabel = edgeData?.label || "";

    // Only update if label actually changed
    if (trimmedLabel !== currentLabel) {
      setIsEditing(false);
      setActiveMode(DiagramMode.Select);
      updateEdge(id, {
        data: {
          ...edgeData,
          label: trimmedLabel,
        },
      });
    } else {
      // Just exit editing mode if no change
      setIsEditing(false);
      setActiveMode(DiagramMode.Select);
    }

    // Reset saving flag after a short delay
    setTimeout(() => {
      isSavingRef.current = false;
    }, 100);
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

      // Only save when actually blurring (not clicking on toolbar)
      if (isEditing) {
        saveLabel();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Blur the textarea to trigger save
      textareaRef.current?.blur();
    }
    // Shift+Enter allows new line, so we don't prevent default
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
    strokeWidth: "2",
    fill: "none",
    opacity: isSelectedByCurrentUser ? 1 : 0,
    pointerEvents: "none" as const,
    zIndex: 1,
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
  // Use custom labelBackgroundColor if set, otherwise use theme-based background (default)
  const labelBackgroundColor = edgeData?.labelBackgroundColor || "var(--card)";

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
      {selectingUsers.map((user) => (
        <BaseEdge
          key={user.connectionId}
          path={edgePath}
          style={{
            stroke: user.color,
            strokeWidth: "2",
            fill: "none",
            opacity: 0.5,
            pointerEvents: "none" as const,
            zIndex: 0,
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
              <foreignObject
                width={100}
                height={100}
                style={{ overflow: "visible", pointerEvents: "auto" }}
              >
                <div style={{ textAlign: "center", width: "100%" }}>
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
                      display: "inline-block",
                      maxWidth: "100px",
                      minWidth: "50px",
                      width: "auto",
                      textAlign: "center",
                      background: labelBackgroundColor,
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      outline: "none",
                      color: labelColor,
                      resize: "none",
                      overflow: "hidden",
                      lineHeight: "1.5",
                      wordWrap: "break-word",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "break-word",
                      padding: "4px 8px",
                      fontFamily: labelFontFamily,
                      fontSize: `${labelFontSize}px`,
                    }}
                  />
                </div>
              </foreignObject>
            </>
          ) : (
            <>
              {/* Background for label - sized based on content with max-width */}
              <foreignObject
                width={100}
                height={100}
                style={{ overflow: "visible", pointerEvents: "auto" }}
                onDoubleClick={handleDoubleClick}
              >
                <div style={{ textAlign: "center", width: "100%" }}>
                  <div
                    style={{
                      display: "inline-block",
                      maxWidth: "100px",
                      minWidth: "50px",
                      width: "auto",
                      padding: "4px 8px",
                      background: labelBackgroundColor,
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      textAlign: "center",
                      wordWrap: "break-word",
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      overflowWrap: "break-word",
                      color: labelColor,
                      fontFamily: labelFontFamily,
                      fontSize: `${labelFontSize}px`,
                      lineHeight: "1.4",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    {edgeData?.label}
                  </div>
                </div>
              </foreignObject>
            </>
          )}
        </g>
      )}
    </>
  );
}

export default memo(CustomEdge);
