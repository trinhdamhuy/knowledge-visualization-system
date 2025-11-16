import { useDiagramStore } from "../_store/use-diagram-store";

export function DiagramNodeToolBar() {
  const { selectedNodeId, nodes, setNodeColor, setNodeShape } = useDiagramStore();
  if (!selectedNodeId) return null;
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const shape = (node.data.shape as string) || "rectangle";
  const color = (node.data.color as string) || "#FF97A7";

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        top: "20%",
        zIndex: 1000,
        background: "#fff",
        padding: "16px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: "180px",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#333", marginBottom: "6px" }}>
          Shape
        </label>
        <select
          value={shape}
          onChange={(e) =>
            setNodeShape(node.id, e.target.value as "rectangle" | "circle")
          }
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "1px solid #ddd",
            outline: "none",
            backgroundColor: "#fff",
          }}
        >
          <option value="rectangle">Rectangle</option>
          <option value="circle">Circle</option>
        </select>
      </div>
      <div>
        <label style={{ display: "block", fontSize: "14px", fontWeight: "500", color: "#333", marginBottom: "6px" }}>
          Color
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setNodeColor(node.id, e.target.value)}
            style={{
              width: "40px",
              height: "40px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          />
          <span style={{ fontSize: "14px", color: "#666" }}>{color}</span>
        </div>
      </div>
    </div>
  );
}
