import { Fragment } from 'react';
import type { CausalFlowPayload } from '../../lens/visualDispatch';

const border = { borderWidth: 1, borderStyle: 'solid' as const, borderColor: 'var(--lens-border)' };

export function CausalFlowPrimitive({
  payload,
  storyMode,
  storyIcons
}: {
  payload: CausalFlowPayload;
  storyMode: boolean;
  storyIcons?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {payload.nodes.map((n, i) => {
        const label = storyMode ? `${storyIcons?.[n.id] ?? ''} ${n.label}`.trim() : n.label;
        const isClaim = i % 2 === 0;
        return (
          <Fragment key={n.id}>
            {i > 0 ? (
              <span className="text-[13px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                {payload.edges[i - 1]?.label ?? '→'}
              </span>
            ) : null}
            <div
              className="rounded-sm px-3 py-2 text-[13px] font-normal leading-snug"
              style={{
                ...border,
                fontFamily: 'var(--lens-font-body)',
                backgroundColor: isClaim ? 'var(--lens-claim-bg)' : 'var(--lens-evidence-bg)',
                color: isClaim ? 'var(--lens-claim-fg)' : 'var(--lens-evidence-fg)'
              }}
            >
              {label}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
