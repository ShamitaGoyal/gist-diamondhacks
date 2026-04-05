import type { ProcedureRailPayload } from '../../lens/visualDispatch';

const border = { borderWidth: 1, borderStyle: 'solid' as const, borderColor: 'var(--lens-border)' };

export function ProcedureRailPrimitive({
  payload,
  storyMode,
  storyIcons
}: {
  payload: ProcedureRailPayload;
  storyMode: boolean;
  storyIcons?: Record<string, string>;
}) {
  return (
    <div className="relative flex gap-0 pl-3">
      <div
        className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--lens-border)]"
        aria-hidden
      />
      <div className="flex flex-col gap-0">
        {payload.steps.map((step, i) => {
          const key = `s${i}`;
          const icon = storyMode && storyIcons?.[key] ? storyIcons[key]! : String(i + 1);
          return (
            <div key={key} className="relative flex gap-3 py-2.5">
              <div
                className="relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px]"
                style={{
                  ...border,
                  fontFamily: 'var(--lens-font-mono)',
                  backgroundColor: 'var(--lens-surface)',
                  color: 'var(--lens-fg)'
                }}
              >
                {icon}
              </div>
              <div
                className="min-w-0 flex-1 rounded-sm px-3 py-2 text-[13px] font-normal leading-snug"
                style={{
                  ...border,
                  fontFamily: 'var(--lens-font-body)',
                  backgroundColor: 'var(--lens-surface-2)',
                  color: 'var(--lens-fg)'
                }}
              >
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
