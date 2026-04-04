import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'motion/react';

export interface DAGNode {
  id: string;
  label: string;
  type: 'thesis' | 'method' | 'finding';
  x: number;
  y: number;
  children?: string[];
  /** PDF section id for context lens (scroll + highlight) */
  sectionId?: string;
}

interface HierarchicalDAGProps {
  nodes: DAGNode[];
  onNodeClick: (nodeId: string, sectionId?: string) => void;
  sketchMode: boolean;
  cognitiveLoad: 'skim' | 'study' | 'deep';
}

function edgeJitter(seed: string, i: number) {
  let h = 0;
  for (let k = 0; k < seed.length; k++) h = (h * 31 + seed.charCodeAt(k)) >>> 0;
  const x = Math.sin((h + i) * 0.017) * 43758.5453;
  return x - Math.floor(x);
}

function edgeKeysFromRoot(rootId: string, nodes: DAGNode[]): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const keys = new Set<string>();
  const walk = (id: string) => {
    const n = byId.get(id);
    if (!n?.children?.length) return;
    for (const c of n.children) {
      keys.add(`${id}-${c}`);
      walk(c);
    }
  };
  walk(rootId);
  return keys;
}

export function HierarchicalDAG({ nodes, onNodeClick, sketchMode, cognitiveLoad }: HierarchicalDAGProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visibleNodes = useMemo(() => {
    if (cognitiveLoad === 'deep') return nodes;
    if (cognitiveLoad === 'skim') return nodes.filter((n) => n.type === 'thesis');
    return nodes.filter((n) => n.type === 'thesis' || n.type === 'method');
  }, [nodes, cognitiveLoad]);

  const visibleIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 1000);
  };

  const activeEdges = useMemo(
    () => (selectedId ? edgeKeysFromRoot(selectedId, nodes) : null),
    [selectedId, nodes]
  );

  const handleClick = (node: DAGNode) => {
    setSelectedId((prev) => (prev === node.id ? null : node.id));
    onNodeClick(node.id, node.sectionId);
  };

  const strokeForEdge = (parent: DAGNode, child: DAGNode, highlighted: boolean) => {
    if (sketchMode) return highlighted ? 2.5 : 2;
    const base = parent.type === 'thesis' && child.type === 'method' ? 2.25 : 1.15;
    return highlighted ? base + 1.2 : base;
  };

  const renderNode = (node: DAGNode) => {
    const baseClasses = 'absolute cursor-pointer transition-transform hover:scale-105';
    const sketchClasses = sketchMode ? 'border-2 border-[var(--lens-stroke)]' : 'border border-[var(--lens-border)]';

    const glow = selectedId === node.id;

    const inner = () => {
      if (node.type === 'thesis') {
        return (
          <div
            className={`${baseClasses} ${sketchClasses} rounded-[6px] px-4 py-2`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              transform: sketchMode ? 'rotate(-0.5deg)' : 'none',
              backgroundColor: 'var(--lens-surface-2)',
              boxShadow: glow ? '0 0 0 2px var(--lens-accent)' : undefined
            }}
            onClick={() => handleClick(node)}
          >
            <span
              className="text-[12px]"
              style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600, color: 'var(--lens-accent)' }}
            >
              {node.label}
            </span>
          </div>
        );
      }
      if (node.type === 'method') {
        return (
          <div
            className={`${baseClasses} ${sketchClasses} w-24 h-16 flex items-center justify-center`}
            style={{
              left: `${node.x}px`,
              top: `${node.y}px`,
              borderRadius: 4,
              transform: sketchMode ? 'rotate(0.5deg)' : 'none',
              backgroundColor: 'var(--lens-surface)',
              boxShadow: glow ? '0 0 0 1px var(--lens-accent)' : undefined
            }}
            onClick={() => handleClick(node)}
          >
            <span
              className="text-[10px] text-center"
              style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600, color: 'var(--lens-fg)' }}
            >
              {node.label}
            </span>
          </div>
        );
      }
      return (
        <div
          className={`${baseClasses} ${sketchClasses} rounded-full w-20 h-20 flex items-center justify-center p-2`}
          style={{
            left: `${node.x}px`,
            top: `${node.y}px`,
            transform: sketchMode ? 'rotate(-0.3deg)' : 'none',
            backgroundColor: 'var(--lens-surface)',
            boxShadow: glow ? '0 0 0 1px var(--lens-accent)' : undefined
          }}
          onClick={() => handleClick(node)}
        >
          <span className="text-[9px] text-center" style={{ fontFamily: 'var(--lens-font-body)', color: 'var(--lens-fg)' }}>
            {node.label}
          </span>
        </div>
      );
    };

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        {inner()}
      </motion.div>
    );
  };

  const renderConnections = () => {
    return nodes.map((node) => {
      if (!node.children) return null;
      return node.children.map((childId) => {
        if (!visibleIds.has(node.id) || !visibleIds.has(childId)) return null;
        const childNode = nodes.find((n) => n.id === childId);
        if (!childNode) return null;

        const startX = node.x + (node.type === 'thesis' ? 60 : node.type === 'method' ? 48 : 40);
        const startY = node.y + (node.type === 'thesis' ? 20 : node.type === 'method' ? 32 : 40);
        const endX = childNode.x + (childNode.type === 'method' ? 48 : 40);
        const endY = childNode.y;
        const midY = (startY + endY) / 2;
        const key = `${node.id}-${childId}`;
        const hi = !!(activeEdges && activeEdges.has(key));
        const strokeW = strokeForEdge(node, childNode, hi);
        const strokeColor = hi ? 'var(--lens-accent)' : sketchMode ? 'var(--lens-muted)' : 'var(--lens-border)';

        if (sketchMode) {
          const j1 = (edgeJitter(key, 1) - 0.5) * 4;
          const j2 = (edgeJitter(key, 2) - 0.5) * 3;
          return (
            <path
              key={key}
              d={`M ${startX} ${startY} Q ${startX + j1} ${midY + j2}, ${endX} ${endY}`}
              stroke={strokeColor}
              strokeWidth={strokeW}
              fill="none"
              className="pointer-events-none"
              opacity={hi ? 1 : 0.85}
            />
          );
        }

        return (
          <path
            key={key}
            d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
            stroke={strokeColor}
            strokeWidth={strokeW}
            fill="none"
            className="pointer-events-none"
            opacity={hi ? 1 : 0.9}
          />
        );
      });
    });
  };

  return (
    <div
      className="rounded-[4px] border p-4 relative"
      style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
    >
      <button
        type="button"
        onClick={handleRegenerate}
        className={`absolute top-3 right-3 p-2 rounded-[4px] transition-colors hover:opacity-80 ${
          isRegenerating ? 'animate-spin' : ''
        }`}
        style={{ color: 'var(--lens-muted)' }}
        aria-label="Regenerate map"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      <p className="mb-2 pr-10 text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
        // Orthogonal edges · line weight ≈ support · click claim to trace evidence
      </p>

      <div className="relative" style={{ height: '500px' }}>
        <svg className="absolute inset-0 w-full h-full">
          {renderConnections()}
        </svg>
        {visibleNodes.map(renderNode)}
      </div>
    </div>
  );
}
