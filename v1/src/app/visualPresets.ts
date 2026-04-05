import type { CSSProperties } from 'react';

export type VisualPresetId = 'blueprint' | 'paper-native' | 'sketch';

/** CSS variables consumed by the shell, React Flow edges, and sketch surfaces. */
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
        ['--lens-font-mono' as string]: '"JetBrains Mono", ui-monospace, monospace',
        ['--lens-flow-edge' as string]: '#7CB9FF',
        ['--lens-flow-edge-width' as string]: '1',
        ['--lens-flow-edge-active' as string]: '#A0C4FF',
        ['--lens-claim-bg' as string]: '#1e3a5f',
        ['--lens-claim-fg' as string]: '#A0C4FF',
        ['--lens-evidence-bg' as string]: '#0f2847',
        ['--lens-evidence-fg' as string]: '#5EEAD4',
        ['--lens-warn-bg' as string]: '#422006',
        ['--lens-warn-fg' as string]: '#FBBF24'
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
        ['--lens-font-mono' as string]: '"JetBrains Mono", ui-monospace, monospace',
        ['--lens-flow-edge' as string]: '#475569',
        ['--lens-flow-edge-width' as string]: '1',
        ['--lens-flow-edge-active' as string]: '#6366F1',
        ['--lens-claim-bg' as string]: '#EEF2FF',
        ['--lens-claim-fg' as string]: '#6366F1',
        ['--lens-evidence-bg' as string]: '#F0FDFA',
        ['--lens-evidence-fg' as string]: '#14B8A6',
        ['--lens-warn-bg' as string]: '#FFFBEB',
        ['--lens-warn-fg' as string]: '#D97706'
      } as CSSProperties;
    case 'paper-native':
    default:
      return {
        ['--lens-bg' as string]: '#FAFAFA',
        ['--lens-fg' as string]: '#111111',
        ['--lens-muted' as string]: '#64748B',
        ['--lens-border' as string]: '#E5E5E5',
        ['--lens-surface' as string]: '#FFFFFF',
        ['--lens-surface-2' as string]: '#FAFAFA',
        ['--lens-stroke' as string]: '#111111',
        ['--lens-accent' as string]: '#6366F1',
        ['--lens-font-body' as string]: 'Inter, ui-sans-serif, system-ui, sans-serif',
        ['--lens-font-mono' as string]: '"JetBrains Mono", ui-monospace, monospace',
        ['--lens-claim-bg' as string]: '#EEF2FF',
        ['--lens-claim-fg' as string]: '#6366F1',
        ['--lens-evidence-bg' as string]: '#F0FDFA',
        ['--lens-evidence-fg' as string]: '#14B8A6',
        ['--lens-warn-bg' as string]: '#FFFBEB',
        ['--lens-warn-fg' as string]: '#D97706',
        ['--lens-flow-edge' as string]: '#A3A3A3',
        ['--lens-flow-edge-width' as string]: '1',
        ['--lens-flow-edge-active' as string]: '#6366F1'
      } as CSSProperties;
  }
}

/** Resolved colors for Rough.js (cannot read CSS vars inside canvas/SVG generation reliably). */
export function mapNodeTheme(preset: VisualPresetId) {
  switch (preset) {
    case 'blueprint':
      return {
        stroke: '#A0C4FF',
        fillThesis: '#0a1f38',
        fillMethod: '#0f2847',
        fillFinding: '#0f2847'
      };
    case 'sketch':
      return {
        stroke: '#475569',
        fillThesis: '#FFFFFF',
        fillMethod: '#F8FAFC',
        fillFinding: '#FFFFFF'
      };
    case 'paper-native':
    default:
      return {
        stroke: '#E5E5E5',
        fillThesis: '#FAFAFA',
        fillMethod: '#FFFFFF',
        fillFinding: '#FFFFFF'
      };
  }
}
