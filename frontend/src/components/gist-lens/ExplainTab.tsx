import { useCallback, useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { ExplainVisualPayload } from "@/lib/gistLensApi";
import { explainVisualHasContent, fetchExplainRefine, type ExplainRefineMode } from "@/lib/gistLensApi";
import { ExplainVisualRenderer, explainVisualKindLabel } from "./ExplainVisualRenderer";

interface ExplainTabProps {
  /** Snippet being explained (selection or highlight text) for empty / loading states */
  selectionPreview: string | null;
  explanation: {
    quote: string;
    visual?: React.ReactNode;
    apiVisual?: ExplainVisualPayload | null;
    plain: string;
    followups: string[];
  } | null;
  isLoading: boolean;
}

type Continuation = {
  id: string;
  mode: ExplainRefineMode;
  plain: string;
  apiVisual: ExplainVisualPayload;
};

const MODE_LABEL: Record<ExplainRefineMode, string> = {
  simpler: "Even simpler",
  more_detail: "Step by step",
  analogy: "Kids’ analogy",
};

function getRefineContext(
  explanation: ExplainTabProps["explanation"],
  continuations: Continuation[]
): { plain: string; visual: ExplainVisualPayload | null } {
  if (!explanation) return { plain: "", visual: null };
  if (continuations.length === 0) {
    return {
      plain: explanation.plain,
      visual: explanation.apiVisual ?? null,
    };
  }
  const last = continuations[continuations.length - 1];
  return { plain: last.plain, visual: last.apiVisual };
}

function ExplainBlock({
  heading,
  badge,
  plain,
  apiVisual,
  legacyVisual,
}: {
  heading: string;
  badge?: string;
  plain: string;
  apiVisual?: ExplainVisualPayload | null;
  legacyVisual?: React.ReactNode;
}) {
  const apiShows = explainVisualHasContent(apiVisual);
  const legacyShows = Boolean(legacyVisual);
  const showVisual = apiShows || legacyShows;

  return (
    <div className="flex flex-col gap-3">
      {badge ? (
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-mid/15 text-accent-dark font-semibold uppercase tracking-wide">
            {badge}
          </span>
        </div>
      ) : null}
      {showVisual ? (
        <div className="bg-surface-2 border border-border rounded-lg p-3">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <p className="text-[9.5px] font-semibold text-text-tertiary uppercase tracking-wider">Visual</p>
            {apiVisual?.caption ? (
              <p className="text-[10px] font-medium text-accent-dark text-right leading-snug max-w-[200px]">
                {apiVisual.caption}
              </p>
            ) : apiShows && apiVisual?.kind ? (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent-light text-accent-dark font-medium shrink-0">
                {explainVisualKindLabel(apiVisual.kind)}
              </span>
            ) : null}
          </div>
          <div className="bg-surface rounded-md border border-border p-2.5 flex items-center justify-center min-h-[80px]">
            {apiShows && apiVisual ? <ExplainVisualRenderer visual={apiVisual} /> : legacyVisual}
          </div>
        </div>
      ) : null}
      <div className="bg-surface-2 border border-border rounded-lg p-3.5">
        <p className="text-[9.5px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">{heading}</p>
        <p className="text-[12.5px] leading-[1.75] text-foreground font-light whitespace-pre-wrap">{plain}</p>
      </div>
    </div>
  );
}

const ExplainTab = ({ selectionPreview, explanation, isLoading }: ExplainTabProps) => {
  const [continuations, setContinuations] = useState<Continuation[]>([]);
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const contId = useRef(0);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const resetKey = `${selectionPreview ?? ""}::${explanation?.quote ?? ""}::${explanation?.plain ?? ""}`;
  useEffect(() => {
    setContinuations([]);
    setRefineError(null);
    contId.current = 0;
  }, [resetKey]);

  useEffect(() => {
    if (refineLoading) return;
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [continuations.length, refineLoading]);

  const onRefine = useCallback(
    async (mode: ExplainRefineMode) => {
      if (!selectionPreview?.trim() || !explanation || refineLoading) return;
      setRefineError(null);
      setRefineLoading(true);
      try {
        const { plain, visual } = getRefineContext(explanation, continuations);
        const res = await fetchExplainRefine(selectionPreview.trim(), mode, plain, visual);
        contId.current += 1;
        setContinuations((prev) => [
          ...prev,
          {
            id: `c-${contId.current}`,
            mode,
            plain: res.explanation,
            apiVisual: res.visual,
          },
        ]);
      } catch (e) {
        setRefineError(e instanceof Error ? e.message : "Could not refine explanation");
      } finally {
        setRefineLoading(false);
      }
    },
    [selectionPreview, explanation, continuations, refineLoading]
  );

  if (!selectionPreview && !isLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-tertiary px-6 text-center">
          <div className="w-11 h-11 rounded-xl bg-accent-light flex items-center justify-center">
            <Info className="w-5 h-5 text-accent-mid" />
          </div>
          <p className="text-[12.5px] leading-relaxed max-w-[220px]">
            Highlight any text in the PDF and I'll break it down with a visual and a plain-English explanation.
          </p>
        </div>
        <div className="py-2.5 px-3.5 border-t border-border shrink-0">
          <p className="text-[10px] text-text-tertiary text-center">
            Select any text or tap highlighted text to explain it
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectionPreview ? (
          <div className="px-3.5 pt-3">
            <div className="bg-accent-light rounded-md px-3 py-2 border-l-[3px] border-accent-mid">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-1">Selection</p>
              <p className="text-[11px] text-accent-dark leading-relaxed italic line-clamp-6">{selectionPreview}</p>
            </div>
          </div>
        ) : null}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-1.5 py-1.5 px-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-mid loading-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent-mid loading-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent-mid loading-dot" />
            <span className="text-[11px] text-text-tertiary ml-0.5">Generating explanation…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  const buttonsDisabled = refineLoading || !selectionPreview?.trim();

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-4 thin-scrollbar min-h-0">
        <div className="bg-accent-light rounded-md px-3.5 py-2.5 border-l-[3px] border-accent-mid shrink-0">
          <p className="text-[11.5px] text-accent-dark leading-relaxed italic">{explanation.quote}</p>
        </div>

        <ExplainBlock
          heading="Simple explanation"
          plain={explanation.plain}
          apiVisual={explanation.apiVisual}
          legacyVisual={explanation.visual}
        />

        {continuations.map((c) => (
          <div key={c.id} className="border-t border-border pt-4 flex flex-col gap-3">
            <ExplainBlock heading={MODE_LABEL[c.mode]} plain={c.plain} apiVisual={c.apiVisual} />
          </div>
        ))}

        {refineError ? (
          <p className="text-[11px] text-destructive bg-destructive/10 rounded-md px-2 py-1.5">{refineError}</p>
        ) : null}

        {refineLoading ? (
          <div className="flex items-center gap-2 text-[11px] text-text-tertiary py-2">
            <span className="inline-flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mid animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mid animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent-mid animate-pulse [animation-delay:300ms]" />
            </span>
            Building your follow-up…
          </div>
        ) : null}

        <div ref={scrollAnchorRef} className="h-px w-full shrink-0" aria-hidden />

        <div className="flex gap-2 shrink-0 pb-1">
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => onRefine("simpler")}
            className="flex-1 bg-surface border border-border rounded-md px-2 py-2.5 text-[11px] text-foreground cursor-pointer transition-colors hover:bg-accent-light hover:border-accent-mid/30 hover:text-accent-dark font-medium text-center disabled:opacity-45 disabled:cursor-not-allowed"
          >
            Simpler ↓
          </button>
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => onRefine("more_detail")}
            className="flex-1 bg-surface border border-border rounded-md px-2 py-2.5 text-[11px] text-foreground cursor-pointer transition-colors hover:bg-accent-light hover:border-accent-mid/30 hover:text-accent-dark font-medium text-center disabled:opacity-45 disabled:cursor-not-allowed"
          >
            More detail ↑
          </button>
          <button
            type="button"
            disabled={buttonsDisabled}
            onClick={() => onRefine("analogy")}
            className="flex-1 bg-surface border border-border rounded-md px-2 py-2.5 text-[11px] text-foreground cursor-pointer transition-colors hover:bg-accent-light hover:border-accent-mid/30 hover:text-accent-dark font-medium text-center disabled:opacity-45 disabled:cursor-not-allowed"
          >
            Analogy ↗
          </button>
        </div>
      </div>

      <div className="py-2.5 px-3.5 border-t border-border shrink-0">
        <p className="text-[10px] text-text-tertiary text-center">
          Select any text or tap highlighted text to explain it · Scroll for follow-ups
        </p>
      </div>
    </div>
  );
};

export default ExplainTab;
