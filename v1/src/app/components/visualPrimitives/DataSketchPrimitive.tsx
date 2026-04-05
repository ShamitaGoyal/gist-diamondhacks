import rough from 'roughjs';
import { useLayoutEffect, useRef } from 'react';
import type { DataSketcherPayload } from '../../lens/visualDispatch';

/** Axes-free hand-drawn sparkline (Rough.js). */
export function DataSketchPrimitive({ payload }: { payload: DataSketcherPayload }) {
  const ref = useRef<SVGSVGElement>(null);
  const w = 280;
  const h = 56;

  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || !payload.series.length) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const rc = rough.svg(svg);
    const pts = payload.series.map((p) => [p.x * w, h - p.y * h] as [number, number]);
    const path = rc.linearPath(pts, {
      roughness: 1.35,
      stroke: '#6366F1',
      strokeWidth: 1.5
    });
    svg.appendChild(path);
  }, [payload.series, w, h]);

  return <svg ref={ref} width={w} height={h} className="block overflow-visible" aria-hidden />;
}
