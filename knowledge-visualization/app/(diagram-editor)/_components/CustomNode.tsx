import { memo, useState, useEffect, useRef } from "react";
import {
  NodeProps,
  useReactFlow,
  Handle,
  Position,
  NodeResizer,
} from "@xyflow/react";

const CustomNode = memo(({ data, id, selected, width, height }: NodeProps) => {
  const nodeData = data as { label: string; color?: string; shape?: string };
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const { updateNodeData } = useReactFlow();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    setIsEditing(false);
    if (label.trim()) {
      updateNodeData(id, { label: label.trim() });
    } else {
      setLabel(nodeData.label);
    }
  };

  const handleStartEdit = () => {
    setLabel(nodeData.label);
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    // Shift+Enter will naturally create a new line
  };

  const nodeWidth = width || 150;
  const nodeHeight = height || 50;
  const shape = nodeData.shape || "rectangle";
  const nodeColor = nodeData.color || "var(--card)";

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
    border: shape === "diamond" ? "none" : (selected ? "2px solid var(--ring)" : "1px solid var(--border)"),
    padding: "10px 15px",
    boxShadow: shape === "diamond" ? "none" : (selected
      ? "0 0 0 1px var(--ring), 0 1px 2px 0 rgba(0, 0, 0, 0.1)"
      : "0 1px 2px 0 rgba(0, 0, 0, 0.05)"),
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

  // Render diamond shape with SVG background
  const renderDiamondBackground = () => {
    if (shape !== "diamond") return null;
    return (
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          fill={nodeColor}
          stroke={selected ? "var(--ring)" : "var(--border)"}
          strokeWidth={selected ? "3" : "1.5"}
        />
      </svg>
    );
  };

  return (
    <div
      data-node-id={id}
      data-node-label={label}
      style={shapeStyle}
    >
      {renderDiamondBackground()}
      {selected && (
        <NodeResizer
          minWidth={isSquareShape ? 60 : 100}
          minHeight={isSquareShape ? 60 : 40}
          isVisible={selected}
          keepAspectRatio={isSquareShape}
        />
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />

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
