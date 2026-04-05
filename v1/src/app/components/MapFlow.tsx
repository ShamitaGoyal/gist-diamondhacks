import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge
} from '@xyflow/react';
import type { MapDAGNode } from '../lens/mapdag';
import type { VisualPresetId } from '../visualPresets';
import { mapNodeTheme } from '../visualPresets';
import { LensMapNode, type LensMapNodeData } from './LensMapNode';

const nodeTypes = { lensMap: LensMapNode };

function buildEdges(nodes: MapDAGNode[]): Edge[] {
  const out: Edge[] = [];
  for (const n of nodes) {
    for (const c of n.children ?? []) {
      out.push({
        id: `${n.id}-${c}`,
        source: n.id,
        target: c,
        animated: false
      });
    }
  }
  return out;
}

interface MapFlowCanvasProps {
  dagNodes: MapDAGNode[];
  visualPreset: VisualPresetId;
  sketchStrokes: boolean;
  activeScrollSectionId: string | null;
  onNodeClick: (nodeId: string, sectionId?: string) => void;
  /** Fill parent flex column (Architecture mode) instead of fixed 500px height */
  fillHeight?: boolean;
}

function MapFlowCanvas({
  dagNodes,
  visualPreset,
  sketchStrokes,
  activeScrollSectionId,
  onNodeClick,
  fillHeight = false
}: MapFlowCanvasProps) {
  const { fitView } = useReactFlow();
  const theme = mapNodeTheme(visualPreset);
  const roughSketch = sketchStrokes || visualPreset === 'sketch';

  const flowNodes = useMemo(() => {
    return dagNodes.map((n) => {
      const fill =
        n.type === 'thesis' ? theme.fillThesis : n.type === 'method' ? theme.fillMethod : theme.fillFinding;
      const scrollActive = !!(n.sectionId && n.sectionId === activeScrollSectionId);
      const data: LensMapNodeData = {
        label: n.label,
        nodeType: n.type,
        opacity: 1,
        scrollActive,
        roughSketch,
        strokeColor: theme.stroke,
        fillColor: fill
      };
      return {
        id: n.id,
        type: 'lensMap',
        position: { x: n.x, y: n.y },
        data,
        draggable: false,
        selectable: true
      };
    });
  }, [dagNodes, activeScrollSectionId, roughSketch, theme]);

  const flowEdges = useMemo(() => buildEdges(dagNodes), [dagNodes]);

  /** Refit only when graph structure/positions change—not when scroll highlight updates (avoids panning the canvas). */
  const dagFitKey = useMemo(
    () => dagNodes.map((n) => `${n.id}:${n.x},${n.y}:${(n.children ?? []).join(',')}`).join('|'),
    [dagNodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  useEffect(() => {
    const t = requestAnimationFrame(() => fitView({ padding: 0.2, duration: 0 }));
    return () => cancelAnimationFrame(t);
  }, [fitView, dagFitKey]);

  const onNodeClickRf = useCallback(
    (_: unknown, node: { id: string }) => {
      const raw = dagNodes.find((d) => d.id === node.id);
      onNodeClick(node.id, raw?.sectionId);
    },
    [dagNodes, onNodeClick]
  );

  const heightClass = fillHeight ? 'h-full min-h-[200px]' : 'h-[500px]';
  const hostClass =
    `lens-flow-host ${heightClass} rounded-[4px] border ` +
    (visualPreset === 'blueprint' ? 'lens-flow--blueprint ' : '') +
    (sketchStrokes || visualPreset === 'sketch' ? 'lens-flow--sketch' : '');

  return (
    <ReactFlow
      className={hostClass.trim()}
      style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClickRf}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnDrag={false}
      panOnScroll={false}
      zoomOnScroll={false}
      zoomOnDoubleClick={false}
      zoomOnPinch={false}
      preventScrolling
      fitView
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        style: { stroke: 'var(--lens-flow-edge)', strokeWidth: 'var(--lens-flow-edge-width)' }
      }}
    >
      <Background gap={20} color="var(--lens-border)" style={{ opacity: 0.35 }} />
    </ReactFlow>
  );
}

export interface MapFlowProps extends MapFlowCanvasProps {}

export function MapFlow(props: MapFlowProps) {
  return (
    <ReactFlowProvider>
      <MapFlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
