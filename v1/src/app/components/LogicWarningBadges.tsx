import type { ConsoleLogicWarning, ConsoleWarningSeverity } from '../lens/consoleCritique';
import { severityMeta } from '../lens/consoleCritique';

const PALETTE: Record<ConsoleWarningSeverity, { bg: string; fg: string; border: string }> = {
  fatal: { bg: '#FEF2F2', fg: '#B91C1C', border: '#FECACA' },
  weak: { bg: '#FFFBEB', fg: '#B45309', border: '#FDE68A' },
  context: { bg: '#EFF6FF', fg: '#1D4ED8', border: '#BFDBFE' }
};

export function LogicWarningBadges({ warnings }: { warnings: ConsoleLogicWarning[] }) {
  return (
    <ul className="space-y-2">
      {warnings.map((w) => {
        const p = PALETTE[w.severity];
        const m = severityMeta(w.severity);
        return (
          <li
            key={w.id}
            className="rounded-sm border px-2.5 py-2 text-[11px] leading-snug"
            style={{
              borderWidth: 1,
              borderColor: p.border,
              backgroundColor: p.bg,
              color: p.fg,
              fontFamily: 'var(--lens-font-body)'
            }}
          >
            <span className="font-medium" style={{ fontFamily: 'var(--lens-font-mono)' }}>
              {m.emoji} {w.label}
            </span>
            <p className="mt-1 text-[11px] opacity-95">{w.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
