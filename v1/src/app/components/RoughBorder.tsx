import rough from 'roughjs';
import { useLayoutEffect, useRef } from 'react';

interface RoughBorderProps {
  width: number;
  height: number;
  stroke: string;
  fill: string;
  roughness?: number;
}

/** Hand-drawn SVG border (Sketch preset / sketch mode). */
export function RoughBorder({ width, height, stroke, fill, roughness = 1.4 }: RoughBorderProps) {
  const ref = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg || width < 4 || height < 4) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const rc = rough.svg(svg);
    const r = rc.rectangle(2, 2, width - 4, height - 4, {
      roughness,
      bowing: 0.8,
      stroke,
      strokeWidth: 2,
      fill,
      fillStyle: 'solid'
    });
    svg.appendChild(r);
  }, [width, height, stroke, fill, roughness]);

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      className="pointer-events-none absolute left-0 top-0 overflow-visible"
      aria-hidden
    />
  );
}
