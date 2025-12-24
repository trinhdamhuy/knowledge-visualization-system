"use client";

import {
  DiagramPreview,
  PreviewNode,
} from "@/app/_actions/diagram/update-preview";

function getNodeCenter(n: PreviewNode) {
  const size = ["square", "circle", "diamond"].includes(n.shape)
    ? Math.min(n.w, n.h)
    : null;
  const w = size ?? n.w;
  const h = size ?? n.h;
  return { cx: n.x + w / 2, cy: n.y + h / 2, w, h };
}

interface DiagramStructurePreviewProps {
  preview?: DiagramPreview | null;
}

export function DiagramStructurePreview({
  preview,
}: DiagramStructurePreviewProps) {
  const nodes = preview?.nodes ?? [];
  const edges = preview?.edges ?? [];

  if (nodes.length === 0) {
    return (
      <div className="w-full h-full bg-muted rounded-md flex items-center justify-center"></div>
    );
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Calculate bounds with padding
  const pad = 20;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const n of nodes) {
    const c = getNodeCenter(n);
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + c.w);
    maxY = Math.max(maxY, n.y + c.h);
  }

  // If no valid bounds, return placeholder
  if (!isFinite(minX) || !isFinite(minY)) {
    return (
      <div className="w-full h-full bg-muted rounded-md flex items-center justify-center"></div>
    );
  }

  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full rounded-md bg-card"
      style={{ display: "block" }}
    >
      {/* Edges */}
      <g stroke="rgba(0,0,0,0.35)" strokeWidth="1">
        {edges.map((e) => {
          const s = nodeById.get(e.source);
          const t = nodeById.get(e.target);
          if (!s || !t) return null;
          const sc = getNodeCenter(s);
          const tc = getNodeCenter(t);
          return (
            <line key={e.id} x1={sc.cx} y1={sc.cy} x2={tc.cx} y2={tc.cy} />
          );
        })}
      </g>

      {/* Nodes */}
      <g fill="white" stroke="rgba(0,0,0,0.55)" strokeWidth="1">
        {nodes.map((n) => {
          const c = getNodeCenter(n);
          const w = c.w;
          const h = c.h;

          if (n.shape === "circle") {
            return (
              <ellipse
                key={n.id}
                cx={n.x + w / 2}
                cy={n.y + h / 2}
                rx={w / 2}
                ry={h / 2}
              />
            );
          }

          if (n.shape === "diamond") {
            const cx = n.x + w / 2;
            const cy = n.y + h / 2;
            const pts = `${cx},${n.y} ${n.x + w},${cy} ${cx},${n.y + h} ${
              n.x
            },${cy}`;
            return <polygon key={n.id} points={pts} />;
          }

          // rectangle or square
          const r = n.shape === "rectangle" ? 3 : 0;
          return (
            <rect
              key={n.id}
              x={n.x}
              y={n.y}
              width={w}
              height={h}
              rx={r}
              ry={r}
            />
          );
        })}
      </g>
    </svg>
  );
}
