export type ConsoleWarningSeverity = 'fatal' | 'weak' | 'context';

export interface ConsoleLogicWarning {
  id: string;
  severity: ConsoleWarningSeverity;
  label: string;
  detail: string;
}

const SEV: Record<ConsoleWarningSeverity, { emoji: string }> = {
  fatal: { emoji: '🔴' },
  weak: { emoji: '🟡' },
  context: { emoji: '🔵' }
};

/** Demo /critique output from current PDF selection. */
export async function mockConsoleCritique(selection: string): Promise<ConsoleLogicWarning[]> {
  await new Promise((r) => setTimeout(r, 260));
  const t = selection.slice(0, 200).toLowerCase();
  const out: ConsoleLogicWarning[] = [
    {
      id: 'w1',
      severity: 'fatal',
      label: 'Logic warning',
      detail:
        t.length < 40
          ? 'Selection is very short—inference from context alone is fragile.'
          : 'Strong claim language detected; verify each noun maps to a cited result or definition.'
    },
    {
      id: 'w2',
      severity: 'weak',
      label: 'Logic warning',
      detail: 'Check for unstated assumptions between this passage and the prior section’s definitions.'
    },
    {
      id: 'w3',
      severity: 'context',
      label: 'Logic warning',
      detail: 'Cross-reference figures or evaluation sections that exercise this claim—may be forward-referenced only.'
    }
  ];
  return out;
}

export function severityMeta(sev: ConsoleWarningSeverity) {
  return SEV[sev];
}
