export type LinterSeverity = 'fatal' | 'weak' | 'context';

export interface LinterEntry {
  id: string;
  severity: LinterSeverity;
  code: string;
  title: string;
  body: string;
  ref?: string;
}

const MOCK_ENTRIES: LinterEntry[] = [
  {
    id: '1',
    severity: 'fatal',
    code: 'SAMPLE',
    title: 'Underpowered sample',
    body: 'n=50 with multiple comparisons risks inflated positives; no power analysis reported.',
    ref: '§4.2'
  },
  {
    id: '2',
    severity: 'weak',
    code: 'ASSUMP',
    title: 'Unstated stationarity assumption',
    body: 'Training dynamics discussion treats the loss curve as stable without noting batch-noise regime.',
    ref: '§3.1'
  },
  {
    id: '3',
    severity: 'context',
    code: 'CITE_GAP',
    title: 'Missing recent baselines',
    body: 'No comparison to post-2024 efficient-attention variants cited in related work.',
    ref: '§2'
  },
  {
    id: '4',
    severity: 'fatal',
    code: 'P_HACK',
    title: 'Optional stopping on dev set',
    body: 'Best checkpoint chosen on test-adjacent dev split without correction; reads like implicit multiple testing.',
    ref: '§5'
  }
];

const SEV_META: Record<LinterSeverity, { emoji: string; label: string; fg: string; bg: string }> = {
  fatal: { emoji: '🔴', label: 'Fatal logic', fg: '#B91C1C', bg: '#FEF2F2' },
  weak: { emoji: '🟡', label: 'Weak link', fg: '#B45309', bg: '#FFFBEB' },
  context: { emoji: '🔵', label: 'Context gap', fg: '#1D4ED8', bg: '#EFF6FF' }
};

function ConflictVenn() {
  return (
    <div className="rounded-sm border p-3" style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}>
      <p className="mb-2 text-[11px] font-medium text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
        CONFLICT · Venn (mock contradicting paper)
      </p>
      <svg viewBox="0 0 220 120" className="mx-auto h-28 w-full max-w-[220px]" aria-hidden>
        <circle cx={78} cy={62} r={48} fill="var(--lens-claim-bg)" stroke="var(--lens-claim-fg)" strokeWidth={1} opacity={0.85} />
        <circle cx={142} cy={62} r={48} fill="var(--lens-evidence-bg)" stroke="var(--lens-evidence-fg)" strokeWidth={1} opacity={0.85} />
        <text x={52} y={58} fontSize={10} fill="var(--lens-claim-fg)" fontFamily="var(--lens-font-body)">
          This
        </text>
        <text x={150} y={58} fontSize={10} fill="var(--lens-evidence-fg)" fontFamily="var(--lens-font-body)">
          Smith et al.
        </text>
        <text x={98} y={66} fontSize={9} fill="var(--lens-fg)" fontFamily="var(--lens-font-mono)">
          overlap
        </text>
      </svg>
      <p className="mt-2 text-[11px] leading-snug text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
        Shared mechanism; diverges on scaling law exponent (mock static analysis).
      </p>
    </div>
  );
}

function StabilityMeter({ value }: { value: number }) {
  const h = 112;
  const fillH = (value / 100) * h;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
        Stability
      </span>
      <div className="relative w-2 rounded-sm border" style={{ height: h, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded-sm"
          style={{
            height: fillH,
            background: `linear-gradient(to top, #DC2626 0%, #D97706 45%, #14B8A6 100%)`
          }}
        />
      </div>
      <span className="text-[11px] tabular-nums text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
        {value}%
      </span>
    </div>
  );
}

export function CritiqueLinter({ depth }: { depth: 'skim' | 'deep' }) {
  const entries =
    depth === 'skim' ? MOCK_ENTRIES.filter((e) => e.severity === 'fatal').slice(0, 1) : MOCK_ENTRIES;
  const stability = depth === 'skim' ? 38 : 62;

  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div
          className="rounded-sm border px-3 py-2"
          style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
        >
          <p className="text-[13px] font-medium text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            Academic linter
          </p>
          <p className="mt-1 text-[13px] font-normal leading-relaxed text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            Static analysis for logic bugs and vulnerabilities—like compiler errors for claims.
            {depth === 'skim' ? ' Skim shows one key fatal issue.' : ' Deep runs the full audit.'}
          </p>
        </div>

        <div
          className="rounded-sm border"
          style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
        >
          <div
            className="border-b px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--lens-muted)]"
            style={{ fontFamily: 'var(--lens-font-mono)', borderColor: 'var(--lens-border)' }}
          >
            Problems · {entries.length} {depth === 'skim' ? '(skim)' : '(full)'}
          </div>
          <ul className="divide-y" style={{ borderColor: 'var(--lens-border)' }}>
            {entries.map((e) => {
              const m = SEV_META[e.severity];
              return (
                <li key={e.id} className="px-3 py-2.5" style={{ backgroundColor: m.bg }}>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[13px]" aria-hidden>
                      {m.emoji}
                    </span>
                    <span className="text-[11px] font-medium" style={{ fontFamily: 'var(--lens-font-mono)', color: m.fg }}>
                      {m.label}
                    </span>
                    <span className="text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                      {e.code}
                      {e.ref ? ` · ${e.ref}` : ''}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                    {e.title}
                  </p>
                  <p className="mt-0.5 text-[13px] font-normal leading-relaxed text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                    {e.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        {depth === 'deep' ? <ConflictVenn /> : null}

        <div
          className="rounded-sm border px-3 py-2"
          style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-warn-bg)' }}
        >
          <p className="text-[11px] font-medium text-[var(--lens-warn-fg)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
            Bias · institutional
          </p>
          <p className="mt-1 text-[13px] font-normal leading-relaxed text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            Authors are affiliated with the company selling the benchmark suite used for evaluation; no independent replication
            lab is listed.
          </p>
        </div>
      </div>

      <StabilityMeter value={stability} />
    </div>
  );
}
