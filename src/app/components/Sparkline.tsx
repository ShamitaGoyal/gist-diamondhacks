interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  sketchMode?: boolean;
  /** Normalized 0–1 coordinates; when set, overrides `data` mapping */
  series?: { x: number; y: number }[];
}

function stableJitter(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function Sparkline({ data, width = 200, height = 40, sketchMode = false, series }: SparklineProps) {
  const points = series?.length
    ? series.map((p) => ({
        x: p.x * width,
        y: height - p.y * height
      }))
    : (() => {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;
        return data.map((value, index) => {
          const x = (index / Math.max(1, data.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          return { x, y };
        });
      })();

  const pathD = points
    .map((point, index) => {
      if (sketchMode) {
        const jitterX = (stableJitter(index * 2) - 0.5) * 1.2;
        const jitterY = (stableJitter(index * 2 + 1) - 0.5) * 2;
        return `${index === 0 ? 'M' : 'L'} ${point.x + jitterX} ${point.y + jitterY}`;
      }
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        stroke={sketchMode ? '#6366F1' : '#6366F1'}
        strokeWidth={sketchMode ? '2' : '1.5'}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: sketchMode ? 'none' : 'none'
        }}
      />
      {/* Optional data points */}
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={sketchMode ? 2 : 1.5}
          fill="#6366F1"
          opacity={0.6}
        />
      ))}
    </svg>
  );
}
