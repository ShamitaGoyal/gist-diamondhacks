import type { ExplainFlowchartVisual } from "@/lib/pdfLensApi";

const colors: Record<string, { fill: string; stroke: string; text: string }> = {
  purple: { fill: "#EEEDFE", stroke: "#7F77DD", text: "#3C3489" },
  teal: { fill: "#E1F5EE", stroke: "#5DCAA5", text: "#085041" },
  amber: { fill: "#FAEEDA", stroke: "#EF9F27", text: "#633806" },
  blue: { fill: "#E6F1FB", stroke: "#85B7EB", text: "#0C447C" },
};

type Props = { visual: ExplainFlowchartVisual; className?: string };

export function ExplainDiagramSvg({ visual, className = "" }: Props) {
  const nodes = visual?.nodes ?? [];
  const edges = visual?.edges ?? [];
  const w = Math.max(280, 40 + nodes.length * 120);
  const h = 140;

  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, i) => {
    positions[node.id] = { x: 40 + i * 120, y: 56 };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`w-full max-w-full ${className}`} role="img" aria-label="Concept diagram">
      {edges.map((edge, i) => {
        const a = positions[edge.from];
        const b = positions[edge.to];
        if (!a || !b) return null;
        return (
          <line
            key={i}
            x1={a.x + 50}
            y1={a.y + 16}
            x2={b.x + 50}
            y2={b.y + 16}
            stroke="hsl(var(--border-strong))"
            strokeWidth={1}
          />
        );
      })}
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const c = colors[node.color || "purple"] || colors.purple;
        return (
          <g key={node.id}>
            <rect
              x={pos.x}
              y={pos.y}
              width={100}
              height={32}
              rx={16}
              fill={c.fill}
              stroke={c.stroke}
              strokeWidth={1}
            />
            <text
              x={pos.x + 50}
              y={pos.y + 20}
              textAnchor="middle"
              fontSize={10}
              fill={c.text}
              fontFamily="system-ui, sans-serif"
            >
              {node.label.length > 18 ? `${node.label.slice(0, 16)}…` : node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
