"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { EdgeProps } from "@xyflow/react";
import {
  BaseEdge,
  getBezierPath,
  useInternalNode,
  useReactFlow,
} from "@xyflow/react";
import { useSelf, useOthers } from "@liveblocks/react";
import { getUserColor } from "./utils/user-colors";
import { DiagramMode } from "@/enums/modes";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { useTheme } from "next-themes";
import { getEdgeParams } from "./utils/floating-edge";

function SimpleFloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

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

  // Selection rings (Presence)
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

  const currentUserRingColor = "#3b82f6";

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
    isSavingRef.current = false;
  };

  const saveLabel = () => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    const trimmedLabel = editingLabel.trim();
    const currentLabel = edgeData?.label || "";

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
      setIsEditing(false);
      setActiveMode(DiagramMode.Select);
    }

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

      if (isEditing) {
        saveLabel();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };

  if (!sourceNode || !targetNode) return null;

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode
  );

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  });

  const baseStrokeWidth =
    Number((style as Record<string, string>)?.strokeWidth) || 1;

  // Make edge easier to click: big invisible stroke on the same path
  const hitboxStyle = {
    stroke: "transparent",
    strokeWidth: "18",
    fill: "none",
    pointerEvents: "stroke" as const,
  };

  const innerEdgeStyle = {
    ...(style as Record<string, string>),
    strokeWidth: String(baseStrokeWidth),
    pointerEvents: "auto" as const,
  };

  const labelFontFamily = edgeData?.labelFontFamily || "Inter";
  const labelFontSize = edgeData?.labelFontSize || 12;
  const defaultLabelColor = resolvedTheme === "dark" ? "#ffffff" : "#000000";
  const labelColor = edgeData?.labelColor || defaultLabelColor;
  const labelBackgroundColor = edgeData?.labelBackgroundColor || "var(--card)";
  const hasLabel = edgeData?.label !== undefined && edgeData.label !== "";

  return (
    <>
      {/* Big invisible hitbox to make clicking easy */}
      <BaseEdge path={edgePath} style={hitboxStyle} markerEnd={undefined} />

      {/* Visible edge */}
      <BaseEdge path={edgePath} style={innerEdgeStyle} markerEnd={markerEnd} />

      {/* Ring for current user */}
      <BaseEdge
        path={edgePath}
        markerEnd={undefined}
        style={{
          stroke: currentUserRingColor,
          strokeWidth: "2",
          fill: "none",
          opacity: isSelectedByCurrentUser ? 1 : 0,
          pointerEvents: "none" as const,
        }}
      />

      {/* Rings for other users */}
      {selectingUsers.map((user) => (
        <BaseEdge
          key={user.connectionId}
          path={edgePath}
          markerEnd={undefined}
          style={{
            stroke: user.color,
            strokeWidth: "2",
            fill: "none",
            opacity: 0.5,
            pointerEvents: "none" as const,
          }}
        />
      ))}

      {/* Invisible clickable area for adding/editing label when no label exists */}
      {!hasLabel && !isEditing && (
        <g
          transform={`translate(${labelX}, ${labelY})`}
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "pointer", pointerEvents: "auto" }}
        >
          <rect x={-30} y={-10} width={60} height={20} fill="transparent" />
        </g>
      )}

      {/* Edge Label (supports editing on double click) */}
      {(hasLabel || isEditing) && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          {isEditing ? (
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
                    maxWidth: "160px",
                    minWidth: "60px",
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
          ) : (
            <foreignObject
              width={160}
              height={100}
              style={{ overflow: "visible", pointerEvents: "auto" }}
              onDoubleClick={handleDoubleClick}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <div
                  style={{
                    display: "inline-block",
                    maxWidth: "160px",
                    minWidth: "60px",
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
          )}
        </g>
      )}
    </>
  );
}

export default memo(SimpleFloatingEdge);
