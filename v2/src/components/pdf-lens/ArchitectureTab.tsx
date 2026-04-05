import { useId, useState } from "react";
import { GitBranch, Asterisk, List, Share2 } from "lucide-react";

export interface TreeNode {
  id: string;
  label: string;
  sublabel?: string;
  sectionId: string;
  /** From AI architecture API */
  childrenIds?: string[];
  depth?: number;
}

type ViewMode = "tree" | "radial" | "list" | "mindmap";

const viewModes: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "tree", label: "Tree", icon: <GitBranch className="w-3.5 h-3.5" /> },
  { id: "radial", label: "Radial", icon: <Asterisk className="w-3.5 h-3.5" /> },
  { id: "list", label: "List", icon: <List className="w-3.5 h-3.5" /> },
  { id: "mindmap", label: "Mind map", icon: <Share2 className="w-3.5 h-3.5" /> },
];

interface ArchitectureTabProps {
  activeSectionId: string | null;
  onNodeClick: (sectionId: string) => void;
  /** Offline / pre-fetch structure; also defines labels when API graph is absent */
  fallbackNodes: TreeNode[];
  fallbackTitle: string;
  archNodesFromApi?: TreeNode[] | null;
  archTitleFromApi?: string | null;
  archLoading?: boolean;
  archError?: string | null;
}

function countEdgesInMap(children: Map<string, string[]>): number {
  let n = 0;
  for (const ch of children.values()) n += ch.length;
  return n;
}

/** Keep only child refs that match a real node id (model sometimes emits orphans or typos). */
function resolveChildRef(ref: string, nodeById: Map<string, TreeNode>): string | null {
  const r = String(ref).trim();
  return nodeById.has(r) ? r : null;
}

/**
 * Parent stack from outline order: same algorithm as nested headings (depth increases = child).
 * Uses API array order (not sorted by depth) so siblings stay in document order.
 */
function inferOutlineChildrenMap(nodes: TreeNode[]): Map<string, string[]> {
  const children = new Map<string, string[]>();
  const stack: TreeNode[] = [];
  for (const n of nodes) {
    const d = n.depth ?? 0;
    while (stack.length > 0 && (stack[stack.length - 1].depth ?? 0) >= d) {
      stack.pop();
    }
    if (stack.length > 0) {
      const p = stack[stack.length - 1].id;
      if (!children.has(p)) children.set(p, []);
      children.get(p)!.push(n.id);
    }
    stack.push(n);
  }
  return children;
}

/** Vertical tidy tree: root on top, children below, parent centered over subtree; edges read top → down. */
function buildVerticalTreeLayout(nodes: TreeNode[]): {
  positions: Record<string, { x: number; y: number }>;
  edges: [string, string][];
  width: number;
  height: number;
  nodeW: number;
  nodeH: number;
} {
  const NODE_W = 148;
  const NODE_H = 62;
  const V_GAP = 48;
  const H_GAP = 28;
  const PAD = 36;

  if (!nodes.length) {
    return { positions: {}, edges: [], width: 400, height: 280, nodeW: NODE_W, nodeH: NODE_H };
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const n of nodes) {
    const raw = n.childrenIds || [];
    const ch = [
      ...new Set(
        raw
          .map((id) => resolveChildRef(String(id), nodeById))
          .filter((id): id is string => id != null && nodeById.has(id))
      ),
    ];
    children.set(n.id, ch);
    for (const c of ch) hasParent.add(c);
  }

  if (countEdgesInMap(children) === 0 && nodes.length > 1) {
    const inferred = inferOutlineChildrenMap(nodes);
    if (countEdgesInMap(inferred) > 0) {
      for (const n of nodes) {
        children.set(n.id, [...(inferred.get(n.id) || [])]);
      }
    } else {
      const rootId = nodes[0].id;
      for (const n of nodes) children.set(n.id, []);
      children.set(
        rootId,
        nodes.slice(1).map((x) => x.id)
      );
    }
    hasParent.clear();
    for (const n of nodes) {
      for (const c of children.get(n.id) || []) hasParent.add(c);
    }
  }

  let rootList = nodes.map((n) => n.id).filter((id) => !hasParent.has(id));
  if (!rootList.length) rootList = [nodes[0].id];

  const edges: [string, string][] = [];
  for (const n of nodes) {
    for (const c of children.get(n.id) || []) edges.push([n.id, c]);
  }

  const positions: Record<string, { x: number; y: number }> = {};

  function layoutSubtree(rootId: string, startLeft: number): { left: number; right: number } {
    const seen = new Set<string>();

    function place(id: string, leftBound: number, depth: number): { left: number; right: number } {
      if (seen.has(id)) {
        const cx = leftBound + NODE_W / 2;
        const y = depth * (NODE_H + V_GAP);
        if (!(id in positions)) positions[id] = { x: cx, y };
        return { left: leftBound, right: leftBound + NODE_W };
      }
      seen.add(id);

      const ch = (children.get(id) || []).filter((c) => nodeById.has(c));
      const y = depth * (NODE_H + V_GAP);

      if (ch.length === 0) {
        const cx = leftBound + NODE_W / 2;
        positions[id] = { x: cx, y };
        return { left: leftBound, right: leftBound + NODE_W };
      }

      let cur = leftBound;
      const ranges: { left: number; right: number }[] = [];
      for (const c of ch) {
        ranges.push(place(c, cur, depth + 1));
        cur = ranges[ranges.length - 1].right + H_GAP;
      }
      const l = ranges[0].left;
      const r = ranges[ranges.length - 1].right;
      const parentX = (l + r) / 2;
      positions[id] = { x: parentX, y };
      return { left: l, right: r };
    }

    return place(rootId, startLeft, 0);
  }

  let cursor = PAD;
  for (const rid of rootList) {
    const rg = layoutSubtree(rid, cursor);
    cursor = rg.right + H_GAP * 4;
  }

  const placedIds = new Set(Object.keys(positions));
  const orphans = nodes.filter((n) => !placedIds.has(n.id));
  if (orphans.length) {
    const maxY = Math.max(0, ...Object.values(positions).map((p) => p.y));
    const rowY = maxY + NODE_H + V_GAP;
    let ox = PAD;
    for (const n of orphans) {
      positions[n.id] = { x: ox + NODE_W / 2, y: rowY };
      ox += NODE_W + H_GAP;
    }
  }

  let maxX = PAD;
  let maxY = PAD;
  for (const p of Object.values(positions)) {
    maxX = Math.max(maxX, p.x + NODE_W / 2 + PAD);
    maxY = Math.max(maxY, p.y + NODE_H + PAD);
  }

  return {
    positions,
    edges,
    width: Math.max(380, maxX),
    height: Math.max(260, maxY),
    nodeW: NODE_W,
    nodeH: NODE_H,
  };
}

function elbowDownPath(px: number, pyBottom: number, cx: number, cyTop: number): string {
  const midY = pyBottom + (cyTop - pyBottom) * 0.55;
  return `M ${px} ${pyBottom} L ${px} ${midY} L ${cx} ${midY} L ${cx} ${cyTop}`;
}

function DynamicTreeView({
  nodes,
  filteredIds,
  isActive,
  onNodeClick,
}: {
  nodes: TreeNode[];
  filteredIds: Set<string>;
  isActive: (n: TreeNode) => boolean;
  onNodeClick: (id: string) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const arrowId = `arch-arrow-${uid}`;
  const { positions, edges, width, height, nodeW, nodeH } = buildVerticalTreeLayout(nodes);

  return (
    <div className="w-full min-h-[min(52vh,440px)] flex items-start justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-full h-auto min-h-[320px]"
        preserveAspectRatio="xMidYMin meet"
        overflow="visible"
      >
      <defs>
        <marker
          id={arrowId}
          markerWidth="11"
          markerHeight="11"
          refX="9"
          refY="5.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M0,0 L11,5.5 L0,11 Z" fill="hsl(var(--border-strong))" />
        </marker>
      </defs>
      <g className="pointer-events-none" style={{ isolation: "isolate" }}>
        {edges.map(([from, to], i) => {
          if (!filteredIds.has(from) || !filteredIds.has(to)) return null;
          const f = positions[from];
          const t = positions[to];
          if (!f || !t) return null;
          const d = elbowDownPath(f.x, f.y + nodeH, t.x, t.y);
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="hsl(var(--border-strong))"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={`url(#${arrowId})`}
            />
          );
        })}
      </g>
      {nodes.map((node) => {
        const pos = positions[node.id];
        if (!pos || !filteredIds.has(node.id)) return null;
        const active = isActive(node);
        const nw = nodeW;
        const nh = nodeH;
        const isRoot = (node.depth ?? 0) === 0;
        return (
          <g key={node.id} className={`cursor-pointer ${active ? "node-glow" : ""}`} onClick={() => onNodeClick(node.sectionId)}>
            <rect
              x={pos.x - nw / 2}
              y={pos.y}
              width={nw}
              height={nh}
              rx={isRoot ? 10 : 8}
              fill={active ? "hsl(var(--accent-mid))" : isRoot ? "hsl(var(--accent-light))" : "hsl(var(--surface))"}
              stroke={active ? "hsl(var(--accent-dark))" : "hsl(var(--border-strong))"}
              strokeWidth={active ? "2" : "1.5"}
            />
            <text
              x={pos.x}
              y={pos.y + 22}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
            >
              {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
            </text>
            {node.sublabel ? (
              <text
                x={pos.x}
                y={pos.y + 42}
                textAnchor="middle"
                fontSize="9"
                fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--text-tertiary))"}
              >
                {node.sublabel.slice(0, 28)}
              </text>
            ) : null}
          </g>
        );
      })}
      </svg>
    </div>
  );
}

const ArchitectureTab = ({
  activeSectionId,
  onNodeClick,
  fallbackNodes,
  fallbackTitle,
  archNodesFromApi,
  archTitleFromApi,
  archLoading,
  archError,
}: ArchitectureTabProps) => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const useApi = Boolean(archNodesFromApi?.length);

  const isActive = (node: TreeNode) => activeSectionId === node.sectionId;

  const baseNodes = useApi ? archNodesFromApi! : fallbackNodes;
  const filtered = search
    ? baseNodes.filter(
        (n) =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : baseNodes;

  const filteredIds = new Set(filtered.map((n) => n.id));

  const effectiveView: ViewMode = viewMode;

  const architectureTitle = archTitleFromApi ?? fallbackTitle;

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
      {architectureTitle ? (
        <p className="text-[11px] font-medium text-accent-dark leading-snug px-0.5">{architectureTitle}</p>
      ) : null}
      {archError ? (
        <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5">{archError}</p>
      ) : null}
      {archLoading ? (
        <div className="flex items-center gap-2 text-[11px] text-text-tertiary py-2">
          <span className="inline-flex gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-mid animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-mid animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-mid animate-pulse [animation-delay:300ms]" />
          </span>
          Mapping paper structure…
        </div>
      ) : null}
      <input
        type="text"
        placeholder="Search sections..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full py-[7px] px-3 text-xs border border-border rounded-md bg-surface-2 text-foreground outline-none transition-colors focus:border-accent-mid focus:bg-surface placeholder:text-text-tertiary"
      />

      {/* View mode toggles */}
      <div className="flex gap-1 p-1 bg-surface-2 rounded-lg border border-border">
        {viewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
              effectiveView === mode.id
                ? "bg-surface border border-border shadow-sm text-foreground"
                : "text-text-tertiary hover:text-text-secondary"
            }`}
          >
            {mode.icon}
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex-1">
        {effectiveView === "tree" && (
          <DynamicTreeView nodes={filtered} filteredIds={filteredIds} isActive={isActive} onNodeClick={onNodeClick} />
        )}
        {effectiveView === "radial" && <RadialView nodes={filtered} isActive={isActive} onNodeClick={onNodeClick} />}
        {effectiveView === "list" && (
          <ListView nodes={filtered} isActive={isActive} onNodeClick={onNodeClick} activeSectionId={activeSectionId} />
        )}
        {effectiveView === "mindmap" && <MindMapView nodes={filtered} isActive={isActive} onNodeClick={onNodeClick} />}
      </div>

      <div className="flex gap-3 flex-wrap py-1">
        <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <div className="w-2 h-2 rounded-full bg-accent-mid" />
          Active
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
          <div className="w-2 h-2 rounded-full bg-border-strong" />
          Other
        </div>
        <div className="ml-auto text-[10px] text-text-tertiary">Tap a node to jump</div>
      </div>
    </div>
  );
};

// ── Radial View ──
function RadialView({ nodes, isActive, onNodeClick }: { nodes: TreeNode[]; isActive: (n: TreeNode) => boolean; onNodeClick: (id: string) => void }) {
  const center = { x: 160, y: 170 };
  const radius = 120;
  const rootNode = nodes.find((n) => n.id === "root") ?? nodes[0];
  const otherNodes = rootNode ? nodes.filter((n) => n.id !== rootNode.id) : [];

  return (
    <svg viewBox="0 0 320 340" className="w-full">
      {otherNodes.map((node, i) => {
        const angle = (i / otherNodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        return <line key={`line-${node.id}`} x1={center.x} y1={center.y} x2={x} y2={y} stroke="hsl(var(--border))" strokeWidth="1" />;
      })}
      {/* Center node */}
      {rootNode && (
        <g className={`cursor-pointer ${isActive(rootNode) ? "node-glow" : ""}`} onClick={() => onNodeClick(rootNode.sectionId)}>
          <circle cx={center.x} cy={center.y} r={32}
            fill={isActive(rootNode) ? "hsl(var(--accent-mid))" : "hsl(var(--accent-light))"}
            stroke={isActive(rootNode) ? "hsl(var(--accent-dark))" : "hsl(var(--accent-mid))"}
            strokeWidth="2" />
          <text x={center.x} y={center.y - 4} textAnchor="middle" fontSize="8.5" fontWeight="600" fill={isActive(rootNode) ? "hsl(var(--primary-foreground))" : "hsl(var(--accent-dark))"}>{rootNode.label.split(" ")[0]}</text>
          <text x={center.x} y={center.y + 8} textAnchor="middle" fontSize="7.5" fill={isActive(rootNode) ? "hsl(var(--primary-foreground))" : "hsl(var(--text-tertiary))"}>{rootNode.label.split(" ").slice(1).join(" ")}</text>
        </g>
      )}
      {/* Orbiting nodes */}
      {otherNodes.map((node, i) => {
        const angle = (i / otherNodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        const active = isActive(node);
        return (
          <g key={node.id} className={`cursor-pointer ${active ? "node-glow" : ""}`} onClick={() => onNodeClick(node.sectionId)}>
            <rect x={x - 48} y={y - 14} width={96} height={28} rx={6}
              fill={active ? "hsl(var(--accent-mid))" : "hsl(var(--surface))"}
              stroke={active ? "hsl(var(--accent-dark))" : "hsl(var(--border))"}
              strokeWidth={active ? "2" : "1"} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fontWeight="500" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}>{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── List View ──
function ListView({ nodes, isActive, onNodeClick, activeSectionId }: { nodes: TreeNode[]; isActive: (n: TreeNode) => boolean; onNodeClick: (id: string) => void; activeSectionId: string | null }) {
  const colors = ["bg-accent-mid", "bg-green", "bg-amber-500", "bg-blue-500", "bg-rose-400", "bg-teal-500", "bg-orange-400", "bg-purple-400", "bg-cyan-500", "bg-emerald-500"];
  return (
    <div className="flex flex-col gap-1.5">
      {nodes.map((node, i) => {
        const active = isActive(node);
        return (
          <button
            key={node.id}
            onClick={() => onNodeClick(node.sectionId)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left cursor-pointer transition-all border ${
              active
                ? "bg-accent-light border-accent-mid/40 shadow-sm"
                : "bg-surface border-border hover:bg-surface-2"
            }`}
          >
            <div className={`w-0.5 h-8 rounded-full ${active ? "bg-accent-mid" : "bg-border"}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] font-medium truncate ${active ? "text-accent-dark" : "text-foreground"}`}>{node.label}</p>
              {node.sublabel && <p className="text-[10px] text-text-tertiary">{node.sublabel}{active ? " · currently reading" : ""}</p>}
            </div>
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
              active ? "bg-accent-mid text-primary-foreground" : "bg-surface-2 text-text-tertiary border border-border"
            }`}>
              §{i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Mind Map View ──
function MindMapView({ nodes, isActive, onNodeClick }: { nodes: TreeNode[]; isActive: (n: TreeNode) => boolean; onNodeClick: (id: string) => void }) {
  const center = { x: 160, y: 180 };
  const rootNode = nodes.find((n) => n.id === "root") ?? nodes[0];
  const others = rootNode ? nodes.filter((n) => n.id !== rootNode.id) : [];
  const third = Math.max(1, Math.ceil(others.length / 3));
  const leftNodes = others.slice(0, third);
  const topNodes = others.slice(third, third * 2);
  const rightNodes = others.slice(third * 2);

  const allBranches = [
    ...leftNodes.map((n, i) => ({ node: n, x: center.x - 100, y: center.y - 20 + i * 42 })),
    ...topNodes.map((n, i) => ({ node: n, x: center.x - 55 + i * 55, y: center.y - 100 })),
    ...rightNodes.map((n, i) => ({ node: n, x: center.x + 100, y: center.y - 30 + i * 42 })),
  ];

  return (
    <svg viewBox="0 0 320 380" className="w-full">
      {/* Curved connections */}
      {allBranches.map(({ node, x, y }) => {
        const dx = x - center.x;
        const cpx = center.x + dx * 0.5;
        return (
          <path
            key={`path-${node.id}`}
            d={`M${center.x},${center.y} C${cpx},${center.y} ${cpx},${y} ${x},${y}`}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            strokeDasharray={isActive(node) ? "none" : "4 3"}
          />
        );
      })}
      {/* Center */}
      {rootNode && (
        <g className={`cursor-pointer ${isActive(rootNode) ? "node-glow" : ""}`} onClick={() => onNodeClick(rootNode.sectionId)}>
          <ellipse cx={center.x} cy={center.y} rx={45} ry={28}
            fill={isActive(rootNode) ? "hsl(var(--accent-mid))" : "hsl(var(--accent-light))"}
            stroke={isActive(rootNode) ? "hsl(var(--accent-dark))" : "hsl(var(--accent-mid))"}
            strokeWidth="2" />
          <text x={center.x} y={center.y - 3} textAnchor="middle" fontSize="9" fontWeight="600" fill={isActive(rootNode) ? "hsl(var(--primary-foreground))" : "hsl(var(--accent-dark))"}>
            {(rootNode.label.split(" ").slice(0, 2).join(" ") || rootNode.label).slice(0, 22)}
          </text>
          <text x={center.x} y={center.y + 9} textAnchor="middle" fontSize="7.5" fill={isActive(rootNode) ? "hsl(var(--primary-foreground))" : "hsl(var(--text-tertiary))"}>
            {(rootNode.sublabel || rootNode.label.split(" ").slice(2).join(" ") || "·").slice(0, 28)}
          </text>
        </g>
      )}
      {/* Branch nodes */}
      {allBranches.map(({ node, x, y }) => {
        const active = isActive(node);
        const w = 90;
        return (
          <g key={node.id} className={`cursor-pointer ${active ? "node-glow" : ""}`} onClick={() => onNodeClick(node.sectionId)}>
            <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={6}
              fill={active ? "hsl(var(--accent-mid))" : "hsl(var(--surface))"}
              stroke={active ? "hsl(var(--accent-dark))" : "hsl(var(--border))"}
              strokeWidth={active ? "2" : "1"} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="8" fontWeight="500" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}>{node.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default ArchitectureTab;
