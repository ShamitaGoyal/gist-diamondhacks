import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface ConsoleChartSpec {
  title: string;
  points: { x: number; y: number }[];
}

export function ConsoleChartBlock({ spec }: { spec: ConsoleChartSpec }) {
  const data = spec.points.map((p, i) => ({ i, x: p.x, y: p.y }));
  return (
    <div
      className="rounded-sm border p-2"
      style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
    >
      <p className="mb-1 text-[10px] font-medium text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
        Recharts · {spec.title}
      </p>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="x" tick={{ fontSize: 9, fill: 'var(--lens-muted)' }} stroke="var(--lens-border)" />
            <YAxis tick={{ fontSize: 9, fill: 'var(--lens-muted)' }} stroke="var(--lens-border)" width={28} />
            <Tooltip
              contentStyle={{
                fontSize: 11,
                border: '1px solid var(--lens-border)',
                borderRadius: 4,
                backgroundColor: 'var(--lens-surface)'
              }}
            />
            <Line type="monotone" dataKey="y" stroke="var(--lens-accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
