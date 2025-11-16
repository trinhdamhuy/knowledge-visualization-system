import { memo, useState } from "react";
import { NodeProps, useReactFlow } from "@xyflow/react";

const CustomNode = memo(({ data, id }: NodeProps) => {
  const nodeData = data as { label: string; color?: string; shape?: string };
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(nodeData.label);
  const { updateNodeData } = useReactFlow();

  const handleDoubleClick = () => setIsEditing(true);

  const handleBlur = () => {
    setIsEditing(false);
    if (label.trim()) {
      updateNodeData(id, { label: label.trim() });
    }
  };

  const borderRadius = nodeData.shape === "circle" ? "9999px" : "12px";

  return (
    <div
      style={{
        border: "1.5px solid #1a192b",
        background: nodeData.color || "#ff97a7",
        borderRadius,
        minWidth: 80,
        minHeight: 40,
        padding: "8px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: isEditing ? "text" : "none",
        cursor: isEditing ? "text" : "grab",
        color: "#fff",
        fontWeight: 600,
        fontSize: "17px",
        textAlign: "center",
        wordBreak: "break-word",
        whiteSpace: "pre-line",
        boxSizing: "border-box",
        maxWidth: 240
      }}
    >
      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          autoFocus
          style={{
            width: "100%",
            minWidth: 50,
            maxWidth: 220,
            border: "none",
            background: "transparent",
            textAlign: "center",
            outline: "none",
            fontSize: "17px",
            color: "#fff",
          }}
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          style={{ cursor: "pointer", width: "100%" }}
        >
          {nodeData.label}
        </span>
      )}
    </div>
  );
});

CustomNode.displayName = "CustomNode";

export default CustomNode;
