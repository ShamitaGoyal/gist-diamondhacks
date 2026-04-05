import { useMemo, type CSSProperties } from 'react';

/** Step-by-step list for Story mode (split on newlines / sentence boundaries). */
export function StoryStepList({
  text,
  className = '',
  style
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  const steps = useMemo(() => {
    const raw = text.trim();
    if (!raw) return [];
    const byNewline = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (byNewline.length >= 2) return byNewline;
    const sentences = raw.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    return sentences.length >= 2 ? sentences : [raw];
  }, [text]);

  if (steps.length <= 1) {
    return (
      <p
        className={`text-[13px] font-normal leading-relaxed text-[var(--lens-fg)] ${className}`}
        style={style}
      >
        {text}
      </p>
    );
  }

  return (
    <ol
      className={`list-decimal space-y-2 pl-4 text-[13px] font-normal leading-relaxed text-[var(--lens-fg)] ${className}`}
      style={{ fontFamily: 'inherit', ...style }}
    >
      {steps.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  );
}
