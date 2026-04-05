import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { VisualDispatchResult } from '../visualDispatcher';
import type { VisualPresetId } from '../visualPresets';
import { DataSketcher } from './DataSketcher';

interface VisualEngineProps {
  dispatch: VisualDispatchResult;
  preset: VisualPresetId;
  sketchStrokes: boolean;
}

function presetChartColors(preset: VisualPresetId) {
  if (preset === 'blueprint') {
    return { fill: '#A0C4FF', grid: '#1e4d8c', text: '#E2E8F0' };
  }
  if (preset === 'sketch') {
    return { fill: '#6366F1', grid: '#CBD5E1', text: '#334155' };
  }
  return { fill: '#6366F1', grid: '#E2E8F0', text: '#334155' };
}

export function VisualEngine({ dispatch, preset, sketchStrokes }: VisualEngineProps) {
  const c = presetChartColors(preset);
  const mono = preset === 'blueprint' ? 'JetBrains Mono, monospace' : 'JetBrains Mono, monospace';

  const badge = (
    <div className="mb-2 flex items-start justify-between gap-2">
      <span className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: mono }}>
        // VISUAL_DISPATCH · {dispatch.visualizationType}
      </span>
    </div>
  );

  const rationale = (
    <p className="mt-2 text-[10px] leading-relaxed text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
      {dispatch.rationale}
    </p>
  );

  if (dispatch.visualizationType === 'bar_chart' && dispatch.barValues?.length) {
    const data = dispatch.barValues.map((v, i) => ({
      name: dispatch.barLabels?.[i] ?? `S${i + 1}`,
      value: v
    }));
    return (
      <div
        className="rounded-[4px] border p-3"
        style={{
          borderColor: 'var(--lens-border)',
          backgroundColor: 'var(--lens-surface)'
        }}
      >
        {badge}
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: c.text, fontSize: 10 }} axisLine={{ stroke: c.grid }} />
              <YAxis tick={{ fill: c.text, fontSize: 10 }} axisLine={{ stroke: c.grid }} />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: 'var(--lens-surface)',
                  border: `1px solid var(--lens-border)`
                }}
              />
              <Bar dataKey="value" fill={c.fill} radius={[2, 2, 0, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {rationale}
      </div>
    );
  }

  if (dispatch.visualizationType === 'pipeline' && dispatch.pipelineSteps?.length) {
    return (
      <div
        className="rounded-[4px] border p-3"
        style={{
          borderColor: 'var(--lens-border)',
          backgroundColor: 'var(--lens-surface)'
        }}
      >
        {badge}
        <div className="flex flex-wrap items-center gap-1">
          {dispatch.pipelineSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="max-w-[140px] rounded-[4px] border px-2 py-1.5 text-[10px] leading-snug"
                style={{
                  borderColor: 'var(--lens-border)',
                  color: 'var(--lens-fg)',
                  fontFamily: 'var(--lens-font-body)',
                  backgroundColor: 'var(--lens-surface-2)'
                }}
              >
                {step}
              </div>
              {i < dispatch.pipelineSteps!.length - 1 && (
                <span className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: mono }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        {rationale}
      </div>
    );
  }

  if (dispatch.visualizationType === 'circuit_sketcher') {
    const stages = [
      { id: 'in', label: 'Input', w: 72 },
      { id: 'enc', label: 'Encoder', w: 88 },
      { id: 'dec', label: 'Decoder', w: 88 },
      { id: 'out', label: 'Output', w: 72 }
    ];
    const gap = 14;
    let cursor = 16;
    const placed = stages.map((s) => {
      const left = cursor;
      cursor += s.w + gap;
      return { ...s, left };
    });
    const flowY = 50;
    const flows = placed.slice(0, -1).map((s, i) => {
      const next = placed[i + 1];
      const w = 5 + i * 3;
      return (
        <path
          key={`flow-${s.id}`}
          d={`M ${s.left + s.w} ${flowY} L ${next.left} ${flowY}`}
          stroke="var(--lens-stroke)"
          strokeWidth={w}
          strokeLinecap="butt"
          opacity={0.32}
        />
      );
    });
    return (
      <div
        className="rounded-[4px] border p-3"
        style={{
          borderColor: 'var(--lens-border)',
          backgroundColor: 'var(--lens-surface)'
        }}
      >
        {badge}
        <div className="relative h-28 w-full">
          <svg viewBox="0 0 360 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
            {flows}
            {placed.map((s) => (
              <g key={s.id}>
                <rect
                  x={s.left}
                  y={28}
                  width={s.w}
                  height={44}
                  rx={4}
                  fill="var(--lens-surface-2)"
                  stroke="var(--lens-stroke)"
                  strokeWidth={sketchStrokes ? 2 : 1}
                />
                <text
                  x={s.left + s.w / 2}
                  y={54}
                  textAnchor="middle"
                  fill="var(--lens-fg)"
                  fontSize={11}
                  fontFamily="var(--lens-font-body)"
                >
                  {s.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        {dispatch.evidence && (
          <ul className="mt-1 list-inside list-disc text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            {dispatch.evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {rationale}
      </div>
    );
  }

  if (dispatch.visualizationType === 'synthetic_series' && dispatch.series?.length) {
    const sparkData = dispatch.series.map((p) => p.y * 100);
    return (
      <div>
        <DataSketcher
          title={dispatch.claim ?? 'Synthetic signal'}
          data={sparkData}
          description="Plotted from model-supplied [x,y] coordinates (demo: sinusoid)."
          sketchMode={sketchStrokes}
          series={dispatch.series}
        />
        {rationale}
      </div>
    );
  }

  /* dag — compact argument tree inline */
  return (
    <div
      className="rounded-[4px] border p-3"
      style={{
        borderColor: 'var(--lens-border)',
        backgroundColor: 'var(--lens-surface)'
      }}
    >
      {badge}
      <div
        className="rounded-[4px] border px-3 py-2 text-[11px] font-semibold"
        style={{
          borderColor: 'var(--lens-border)',
          color: 'var(--lens-accent)',
          fontFamily: 'var(--lens-font-body)'
        }}
      >
        Claim
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
        {dispatch.claim}
      </p>
      {dispatch.evidence && (
        <div className="mt-2 space-y-1">
          {dispatch.evidence.map((e, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-[4px] border px-2 py-1.5 text-[10px]"
              style={{ borderColor: 'var(--lens-border)', fontFamily: 'var(--lens-font-body)' }}
            >
              <span className="text-[var(--lens-muted)]">▸</span>
              <span className="text-[var(--lens-fg)]">{e}</span>
            </div>
          ))}
        </div>
      )}
      {rationale}
    </div>
  );
}
