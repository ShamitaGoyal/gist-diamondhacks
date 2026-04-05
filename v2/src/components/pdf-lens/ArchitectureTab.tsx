import { useState } from "react";
import { GitBranch, Asterisk, List, Share2 } from "lucide-react";

interface TreeNode {
  id: string;
  label: string;
  sublabel?: string;
  sectionId: string;
}

const nodes: TreeNode[] = [
  { id: "root", label: "Meridian framework", sublabel: "Abstract · Intro", sectionId: "abstract" },
  { id: "spec", label: "Specification", sublabel: "language §3", sectionId: "spec-lang" },
  { id: "content", label: "Content · Layout", sublabel: "Composition", sectionId: "intro" },
  { id: "stake", label: "Three stakeholders", sublabel: "§4", sectionId: "stakeholders" },
  { id: "malleable", label: "Malleable ODIs", sublabel: "§2", sectionId: "what-odi" },
  { id: "what", label: "What are ODIs?", sublabel: "§1–2", sectionId: "what-odi" },
  { id: "tools", label: "Open-source tools", sublabel: "§5", sectionId: "tools" },
  { id: "impl", label: "Implementation", sublabel: "§6", sectionId: "tools" },
  { id: "eval", label: "Evaluation", sublabel: "§7", sectionId: "tools" },
  { id: "conclusion", label: "Conclusion", sublabel: "", sectionId: "tools" },
];

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
}

const ArchitectureTab = ({ activeSectionId, onNodeClick }: ArchitectureTabProps) => {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("tree");

  const isActive = (node: TreeNode) => activeSectionId === node.sectionId;

  const filtered = search
    ? nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()) || n.sublabel?.toLowerCase().includes(search.toLowerCase()))
    : nodes;

  const filteredIds = new Set(filtered.map(n => n.id));

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
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
              viewMode === mode.id
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
        {viewMode === "tree" && <TreeView nodes={filtered} filteredIds={filteredIds} isActive={isActive} onNodeClick={onNodeClick} />}
        {viewMode === "radial" && <RadialView nodes={filtered} isActive={isActive} onNodeClick={onNodeClick} />}
        {viewMode === "list" && <ListView nodes={filtered} isActive={isActive} onNodeClick={onNodeClick} activeSectionId={activeSectionId} />}
        {viewMode === "mindmap" && <MindMapView nodes={filtered} isActive={isActive} onNodeClick={onNodeClick} />}
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

// ── Tree View ──
const treePositions: Record<string, { x: number; y: number }> = {
  root: { x: 160, y: 30 },
  spec: { x: 70, y: 110 },
  content: { x: 250, y: 110 },
  stake: { x: 160, y: 195 },
  malleable: { x: 50, y: 280 },
  what: { x: 160, y: 280 },
  tools: { x: 270, y: 280 },
  impl: { x: 100, y: 360 },
  eval: { x: 220, y: 360 },
  conclusion: { x: 160, y: 430 },
};

const treeEdges = [
  ["root", "spec"], ["root", "content"],
  ["spec", "stake"], ["content", "stake"],
  ["stake", "malleable"], ["stake", "what"], ["stake", "tools"],
  ["malleable", "impl"], ["tools", "eval"],
  ["impl", "conclusion"], ["eval", "conclusion"],
];

function TreeView({ nodes, filteredIds, isActive, onNodeClick }: { nodes: TreeNode[]; filteredIds: Set<string>; isActive: (n: TreeNode) => boolean; onNodeClick: (id: string) => void }) {
  return (
    <svg viewBox="0 0 320 470" className="w-full">
      {treeEdges.map(([from, to], i) => {
        if (!filteredIds.has(from) && !filteredIds.has(to)) return null;
        const f = treePositions[from], t = treePositions[to];
        if (!f || !t) return null;
        return <line key={i} x1={f.x} y1={f.y + 20} x2={t.x} y2={t.y} stroke="hsl(var(--border))" strokeWidth="1.5" />;
      })}
      {nodes.map((node) => {
        const pos = treePositions[node.id];
        if (!pos) return null;
        const active = isActive(node);
        const isRoot = node.id === "root" || node.id === "stake";
        const w = isRoot ? 130 : 100;
        const h = 40;

        if (isRoot) {
          return (
            <g key={node.id} className={`cursor-pointer ${active ? "node-glow" : ""}`} onClick={() => onNodeClick(node.sectionId)}>
              <ellipse cx={pos.x} cy={pos.y + 10} rx={w / 2} ry={h / 2}
                fill={active ? "hsl(var(--accent-mid))" : "hsl(var(--surface-2))"}
                stroke={active ? "hsl(var(--accent-dark))" : "hsl(var(--border))"}
                strokeWidth={active ? "2" : "1.5"} />
              <text x={pos.x} y={pos.y + 7} textAnchor="middle" fontSize="9" fontWeight="600" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}>{node.label}</text>
              {node.sublabel && <text x={pos.x} y={pos.y + 18} textAnchor="middle" fontSize="8" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--text-tertiary))"}>{node.sublabel}</text>}
            </g>
          );
        }

        return (
          <g key={node.id} className={`cursor-pointer ${active ? "node-glow" : ""}`} onClick={() => onNodeClick(node.sectionId)}>
            <rect x={pos.x - w / 2} y={pos.y} width={w} height={h} rx={6}
              fill={active ? "hsl(var(--accent-mid))" : "hsl(var(--surface))"}
              stroke={active ? "hsl(var(--accent-dark))" : "hsl(var(--border))"}
              strokeWidth={active ? "2" : "1.5"} />
            <text x={pos.x} y={pos.y + 16} textAnchor="middle" fontSize="8.5" fontWeight="500" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}>{node.label}</text>
            {node.sublabel && <text x={pos.x} y={pos.y + 28} textAnchor="middle" fontSize="7.5" fill={active ? "hsl(var(--primary-foreground))" : "hsl(var(--text-tertiary))"}>{node.sublabel}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── Radial View ──
function RadialView({ nodes, isActive, onNodeClick }: { nodes: TreeNode[]; isActive: (n: TreeNode) => boolean; onNodeClick: (id: string) => void }) {
  const center = { x: 160, y: 170 };
  const radius = 120;
  const rootNode = nodes.find(n => n.id === "root");
  const otherNodes = nodes.filter(n => n.id !== "root");

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
  const rootNode = nodes.find(n => n.id === "root");
  const rightNodes = nodes.filter(n => ["spec", "what", "stake"].includes(n.id));
  const leftNodes = nodes.filter(n => ["malleable", "tools", "impl", "eval", "conclusion"].includes(n.id));
  const topNodes = nodes.filter(n => n.id === "content");

  const allBranches = [
    ...rightNodes.map((n, i) => ({ node: n, x: center.x + 100, y: center.y - 50 + i * 45 })),
    ...leftNodes.map((n, i) => ({ node: n, x: center.x - 100, y: center.y - 20 + i * 40 })),
    ...topNodes.map((n) => ({ node: n, x: center.x, y: center.y - 100 })),
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
          <text x={center.x} y={center.y - 3} textAnchor="middle" fontSize="9" fontWeight="600" fill={isActive(rootNode) ? "hsl(var(--primary-foreground))" : "hsl(var(--accent-dark))"}>{rootNode.label.split(" ")[0]}</text>
          <text x={center.x} y={center.y + 9} textAnchor="middle" fontSize="7.5" fill={isActive(rootNode) ? "hsl(var(--primary-foreground))" : "hsl(var(--text-tertiary))"}>framework</text>
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
