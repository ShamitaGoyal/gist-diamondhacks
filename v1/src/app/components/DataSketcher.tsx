import { Sparkline } from './Sparkline';

interface DataSketcherProps {
  title: string;
  data: number[];
  description: string;
  sketchMode?: boolean;
  series?: { x: number; y: number }[];
}

export function DataSketcher({ title, data, description, sketchMode = false, series }: DataSketcherProps) {
  return (
    <div
      className="rounded-[4px] border p-4"
      style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
    >
      <div className="mb-3">
        <span className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
          // SYNTHETIC_PLOT · supporting figure
        </span>
      </div>

      <div className="mb-3">
        <h4 className="mb-2 text-[12px]" style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600, color: 'var(--lens-fg)' }}>
          {title}
        </h4>
        <div
          className="flex justify-center rounded-[4px] border py-4"
          style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
        >
          <Sparkline data={data} width={240} height={50} sketchMode={sketchMode} series={series} />
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
        {description}
      </p>
    </div>
  );
}
