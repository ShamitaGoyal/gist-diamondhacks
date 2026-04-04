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
    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4">
      <div className="mb-3">
        <span
          className="text-[10px] text-[#64748B]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          // SYNTHETIC_PLOT
        </span>
      </div>

      <div className="mb-3">
        <h4 className="text-[12px] text-[#1E293B] mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
          {title}
        </h4>
        <div className="flex justify-center py-4 bg-[#FBFBF8] rounded-[4px] border border-[#E2E8F0]">
          <Sparkline data={data} width={240} height={50} sketchMode={sketchMode} series={series} />
        </div>
      </div>

      <p className="text-[11px] text-[#64748B] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
        {description}
      </p>
    </div>
  );
}
