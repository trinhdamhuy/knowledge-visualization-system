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

  return (
    <div
      data-node-id={id}
      data-node-label={label}
      style={{
        background: "var(--card)",
        color: "var(--card-foreground)",
        border: selected
          ? "1px solid var(--border)"
          : "1px solid var(--border)",
        borderRadius: "3px",
        padding: "10px 15px",
        width: `${nodeWidth}px`,
        height: `${nodeHeight}px`,
        minWidth: "150px",
        minHeight: "50px",
        boxShadow: selected
          ? "0 0 0 1px var(--ring), 0 1px 2px 0 rgba(0, 0, 0, 0.1)"
          : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected && (
        <NodeResizer minWidth={150} minHeight={50} isVisible={selected} />
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
