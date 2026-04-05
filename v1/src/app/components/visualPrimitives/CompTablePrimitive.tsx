import { Fragment } from 'react';
import type { CompTablePayload } from '../../lens/visualDispatch';

const border = { borderWidth: 1, borderStyle: 'solid' as const, borderColor: 'var(--lens-border)' };

export function CompTablePrimitive({ payload }: { payload: CompTablePayload }) {
  return (
    <div className="overflow-hidden rounded-sm" style={border}>
      <div className="grid grid-cols-2">
        <div
          className="border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide"
          style={{
            ...border,
            borderTop: 'none',
            borderLeft: 'none',
            fontFamily: 'var(--lens-font-mono)',
            color: 'var(--lens-muted)',
            backgroundColor: 'var(--lens-surface-2)'
          }}
        >
          {payload.col_a_header}
        </div>
        <div
          className="border-b border-l px-3 py-2 text-[11px] font-medium uppercase tracking-wide"
          style={{
            borderColor: 'var(--lens-border)',
            fontFamily: 'var(--lens-font-mono)',
            color: 'var(--lens-muted)',
            backgroundColor: 'var(--lens-surface-2)'
          }}
        >
          {payload.col_b_header}
        </div>
        {payload.rows.map((row, i) => (
          <Fragment key={i}>
            <div
              className="px-3 py-2 text-[13px] font-normal leading-snug"
              style={{
                fontFamily: 'var(--lens-font-body)',
                color: 'var(--lens-fg)',
                backgroundColor: row.highlight_difference ? 'var(--lens-warn-bg)' : 'var(--lens-surface)'
              }}
            >
              {row.left}
            </div>
            <div
              className="border-l px-3 py-2 text-[13px] font-normal leading-snug"
              style={{
                borderColor: 'var(--lens-border)',
                fontFamily: 'var(--lens-font-body)',
                color: 'var(--lens-fg)',
                backgroundColor: row.highlight_difference ? 'var(--lens-warn-bg)' : 'var(--lens-surface)'
              }}
            >
              {row.right}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
