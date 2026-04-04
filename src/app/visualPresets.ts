import type { CSSProperties } from 'react';

export type VisualPresetId = 'blueprint' | 'paper-native' | 'sketch';

/** CSS variables consumed by VisualEngine and themed regions of the shell. */
export function lensVariables(preset: VisualPresetId): CSSProperties {
  switch (preset) {
    case 'blueprint':
      return {
        ['--lens-bg' as string]: '#003366',
        ['--lens-fg' as string]: '#E2E8F0',
        ['--lens-muted' as string]: '#93C5FD',
        ['--lens-border' as string]: '#1e4d8c',
        ['--lens-surface' as string]: '#0f2847',
        ['--lens-surface-2' as string]: '#0a1f38',
        ['--lens-stroke' as string]: '#A0C4FF',
        ['--lens-accent' as string]: '#A0C4FF',
        ['--lens-font-body' as string]: '"JetBrains Mono", ui-monospace, monospace',
        ['--lens-font-mono' as string]: '"JetBrains Mono", ui-monospace, monospace'
      } as CSSProperties;
    case 'sketch':
      return {
        ['--lens-bg' as string]: '#FFFFFF',
        ['--lens-fg' as string]: '#1e293b',
        ['--lens-muted' as string]: '#64748b',
        ['--lens-border' as string]: '#CBD5E1',
        ['--lens-surface' as string]: '#FFFFFF',
        ['--lens-surface-2' as string]: '#F8FAFC',
        ['--lens-stroke' as string]: '#475569',
        ['--lens-accent' as string]: '#6366F1',
        ['--lens-font-body' as string]: '"Architects Daughter", cursive',
        ['--lens-font-mono' as string]: '"JetBrains Mono", ui-monospace, monospace'
      } as CSSProperties;
    case 'paper-native':
    default:
      return {
        ['--lens-bg' as string]: '#FBFBF8',
        ['--lens-fg' as string]: '#111111',
        ['--lens-muted' as string]: '#64748B',
        ['--lens-border' as string]: '#E2E8F0',
        ['--lens-surface' as string]: '#FFFFFF',
        ['--lens-surface-2' as string]: '#FBFBF8',
        ['--lens-stroke' as string]: '#111111',
        ['--lens-accent' as string]: '#6366F1',
        ['--lens-font-body' as string]: '"STIX Two Text", "Times New Roman", Times, serif',
        ['--lens-font-mono' as string]: '"JetBrains Mono", ui-monospace, monospace'
      } as CSSProperties;
  }
}
