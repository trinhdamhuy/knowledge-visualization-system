import { memo, useState, useEffect, useRef, useMemo } from "react";
import {
  NodeProps,
  useReactFlow,
  Handle,
  Position,
  NodeResizer,
} from "@xyflow/react";
import { useDiagramStore } from "../_stores/use-diagram-store";
import { DiagramMode } from "@/enums/modes";
import { useSelf, useOthers } from "@liveblocks/react";
import { getUserColor } from "./utils/user-colors";

type HandleSide = "top" | "bottom" | "left" | "right";

interface CustomNodeData {
  label: string;
  color?: string;
  shape?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  textAlign?: string;
  textColor?: string;
  pageReference?: number;
  sourceHandlePosition?: HandleSide;
  targetHandlePosition?: HandleSide;
}

const CustomNode = memo(({ data, id, width, height }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const { updateNodeData } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setActiveMode } = useDiagramStore();

  // Get selection from Presence
  const currentUser = useSelf();
  const others = useOthers();

  // Determine if node is selected by current user or others
  const isSelectedByCurrentUser = useMemo(() => {
    return (
      currentUser?.presence?.selectedObjectIds?.nodeIds?.includes(id) ?? false
    );
  }, [currentUser, id]);

  // Get users who have selected this node with their colors
  const selectingUsers = useMemo(() => {
    return others
      .filter((other) =>
        other.presence?.selectedObjectIds?.nodeIds?.includes(id)
      )
      .map((other) => ({
        connectionId: other.connectionId,
        color: getUserColor(other.connectionId),
      }));
  }, [others, id]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, label]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleStartEdit();
  };

  const handleBlur = () => {
    setTimeout(() => {
      try {
        // If a toolbar interaction flag is set, keep editing
        if (
          (window as unknown as { __isInteractingWithTextToolbar: boolean })
            .__isInteractingWithTextToolbar
        ) {
          textareaRef.current?.focus();
          return;
        }

        const toolbar = document.querySelector("[data-text-toolbar]");
        const active = document.activeElement as HTMLElement | null;
        if (toolbar && active && toolbar.contains(active)) {
          textareaRef.current?.focus();
          return;
        }
      } catch (e) {
        console.error(e);
        // ignore DOM errors in SSR or restricted environments
      }

      setIsEditing(false);
      setActiveMode(DiagramMode.Select);
      if (label.trim()) {
        updateNodeData(id, { label: label.trim() });
      } else {
        setLabel(nodeData.label);
      }
    }, 0);
  };

  const handleStartEdit = () => {
    setLabel(nodeData.label);
    setIsEditing(true);
    setActiveMode(DiagramMode.Select);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    // Shift+Enter will naturally create a new line
  };

  const nodeWidth = width ?? 150;
  const nodeHeight = height ?? 50;
  const shape = nodeData.shape || "rectangle";
  const nodeColor = nodeData.color || "var(--card)";

  // Text styles
  const textStyles: React.CSSProperties = {
    fontFamily: nodeData.fontFamily || "Inter",
    fontSize: `${nodeData.fontSize || 14}px`,
    fontWeight:
      (nodeData.fontWeight as React.CSSProperties["fontWeight"]) || "normal",
    fontStyle:
      (nodeData.fontStyle as React.CSSProperties["fontStyle"]) || "normal",
    textDecoration: nodeData.textDecoration || "none",
    textAlign:
      (nodeData.textAlign as React.CSSProperties["textAlign"]) || "center",
    color: nodeData.textColor || "inherit",
  };

  // Determine if shape needs equal dimensions
  const isSquareShape = ["square", "circle", "diamond"].includes(shape);
  const shapeSize = isSquareShape ? Math.min(nodeWidth, nodeHeight) : nodeWidth;

  // Get border-radius for different shapes
  const getBorderRadius = (shapeType: string): string => {
    switch (shapeType) {
      case "circle":
        return "50%";
      default:
        return "3px";
    }
  };

  const baseStyle: React.CSSProperties = {
    background: shape === "diamond" ? "transparent" : nodeColor,
    color: "var(--card-foreground)",
    border: shape === "diamond" ? "none" : "1px solid var(--border)",
    padding: "10px 15px",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const getShapeStyle = (): React.CSSProperties => {
    const borderRadius = getBorderRadius(shape);

    if (isSquareShape) {
      return {
        ...baseStyle,
        width: `${shapeSize}px`,
        height: `${shapeSize}px`,
        minWidth: "60px",
        minHeight: "60px",
        borderRadius,
      };
    }

    return {
      ...baseStyle,
      width: `${nodeWidth}px`,
      height: `${nodeHeight}px`,
      minWidth: "100px",
      minHeight: "40px",
      borderRadius,
    };
  };

  const shapeStyle = getShapeStyle();

  // --- Handle configuration (exactly one source + one target, never same side) ---
  const toPosition = (pos: HandleSide): Position => {
    switch (pos) {
      case "top":
        return Position.Top;
      case "bottom":
        return Position.Bottom;
      case "left":
        return Position.Left;
      case "right":
      default:
        return Position.Right;
    }
  };

  // Derive source/target positions: use explicit fields with safe defaults
  const rawSourceSide: HandleSide = nodeData.sourceHandlePosition ?? "right";
  const rawTargetSide: HandleSide = nodeData.targetHandlePosition ?? "left";

  // Ensure source and target are never the same side
  const normalizeTargetSide = (
    sourceSide: HandleSide,
    targetSide: HandleSide
  ): HandleSide => {
    if (targetSide !== sourceSide) return targetSide;

    // Simple, deterministic fallback when they match
    switch (sourceSide) {
      case "right":
        return "left";
      case "left":
        return "right";
      case "top":
        return "bottom";
      case "bottom":
      default:
        return "top";
    }
  };

  const sourceSide = rawSourceSide;
  const targetSide = normalizeTargetSide(rawSourceSide, rawTargetSide);

  const sourcePosition = toPosition(sourceSide);
  const targetPosition = toPosition(targetSide);

  // Render diamond shape with SVG background
  const renderDiamondBackground = () => {
    if (shape !== "diamond") return null;
    return (
      <>
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Main diamond - render first (bottom layer) */}
          <polygon
            points="50,2 98,50 50,98 2,50"
            fill={nodeColor}
            stroke="var(--border)"
          />
          {/* Rings for other users' selections - outside rings */}
          {selectingUsers.map((user) => (
            <polygon
              key={user.connectionId}
              points="50,2 98,50 50,98 2,50"
              fill="none"
              stroke={user.color}
              strokeWidth="2"
            />
          ))}
        </svg>
      </>
    );
  };

  return (
    <div data-node-id={id} data-node-label={label} style={shapeStyle}>
      {/* Ring for selection - similar to edge */}
      {renderDiamondBackground()}
      {/* Ring for current user selection (for non-diamond shapes) - middle ring */}
      {/* Rings for other users' selections (for non-diamond shapes) - outside rings */}
      {shape !== "diamond" &&
        selectingUsers.map((user) => (
          <div
            key={user.connectionId}
            style={{
              position: "absolute",
              inset: "-1px",
              border: `2px solid ${user.color}`,
              borderRadius: shapeStyle.borderRadius,
              opacity: 0.5,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ))}
      {isSelectedByCurrentUser && (
        <NodeResizer
          minWidth={isSquareShape ? 60 : 100}
          minHeight={isSquareShape ? 60 : 40}
          isVisible={isSelectedByCurrentUser}
          keepAspectRatio={isSquareShape}
        />
      )}
      {/* Render exactly one source and one target handle (never same side) */}
      <Handle type="source" position={sourcePosition} />
      <Handle type="target" position={targetPosition} />

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            // Auto resize textarea
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="nodrag nopan"
          style={{
            width: "100%",
            minWidth: 50,
            textAlign: "center",
            fontSize: "14px",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "inherit",
            resize: "none",
            overflow: "hidden",
            fontFamily: "inherit",
            lineHeight: "1.5",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            position: "relative",
            zIndex: 1,
            ...textStyles,
          }}
        />
      ) : (
        <div
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: "pointer",
            width: "100%",
            textAlign: "center",
            fontSize: "14px",
            wordWrap: "break-word",
            whiteSpace: "pre-wrap",
            lineHeight: "1.5",
            position: "relative",
            zIndex: 1,
            ...textStyles,
          }}
        >
          {nodeData.label}
        </div>
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
