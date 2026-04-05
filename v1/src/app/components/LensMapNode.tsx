import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { RoughBorder } from './RoughBorder';

export type LensMapNodeData = {
  label: string;
  nodeType: 'thesis' | 'method' | 'finding';
  opacity: number;
  scrollActive: boolean;
  roughSketch: boolean;
  strokeColor: string;
  fillColor: string;
};

function handlesFor(nodeType: LensMapNodeData['nodeType']) {
  if (nodeType === 'thesis') {
    return <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />;
  }
  if (nodeType === 'finding') {
    return <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />;
  }
  return (
    <>
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </>
  );
}

export function LensMapNode({ data }: NodeProps<LensMapNodeData>) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 120, h: 44 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { label, nodeType, opacity, scrollActive, roughSketch, strokeColor, fillColor } = data;
  const isRound = nodeType === 'finding';
  const shapeClass = isRound ? 'rounded-full min-h-[5rem] min-w-[5rem] px-2' : nodeType === 'thesis' ? 'rounded-md px-4 py-2' : 'rounded-md px-2 py-2 min-h-[4rem] min-w-[6rem]';

  return (
    <div ref={wrapRef} className="relative inline-block cursor-pointer" style={{ opacity }}>
      {handlesFor(nodeType)}
      <motion.div
        className={`relative flex items-center justify-center text-center ${shapeClass}`}
        animate={{
          outlineWidth: scrollActive ? 2 : 0,
          outlineOffset: scrollActive ? 1 : 0,
          outlineStyle: scrollActive ? 'solid' : 'none',
          outlineColor: 'var(--lens-accent)',
          boxShadow: scrollActive
            ? '0 0 0 1px color-mix(in srgb, var(--lens-accent) 40%, transparent), 0 0 18px 4px color-mix(in srgb, var(--lens-accent) 35%, transparent), 0 0 36px 8px color-mix(in srgb, var(--lens-accent) 18%, transparent)'
            : 'none'
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          backgroundColor: roughSketch ? 'transparent' : fillColor,
          fontFamily: 'var(--lens-font-body)',
          color: nodeType === 'thesis' ? 'var(--lens-accent)' : 'var(--lens-fg)',
          fontWeight: nodeType === 'thesis' ? 600 : 600
        }}
      >
        {roughSketch ? (
          <RoughBorder width={size.w} height={size.h} stroke={strokeColor} fill={fillColor} />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] border"
            style={{ borderColor: strokeColor }}
          />
        )}
        <span className={`relative z-[1] leading-tight ${nodeType === 'finding' ? 'text-[9px]' : nodeType === 'method' ? 'text-[10px]' : 'text-[12px]'}`}>
          {label}
        </span>
      </motion.div>
    </div>
  );
}
