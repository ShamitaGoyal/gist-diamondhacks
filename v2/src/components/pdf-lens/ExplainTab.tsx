import { Info } from "lucide-react";

interface ExplainTabProps {
  selectedText: string | null;
  explanation: {
    quote: string;
    visual?: React.ReactNode;
    plain: string;
    followups: string[];
  } | null;
  isLoading: boolean;
}

const ExplainTab = ({ selectedText, explanation, isLoading }: ExplainTabProps) => {
  if (!selectedText && !isLoading) {
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
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1.5 py-1.5 px-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-mid loading-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-mid loading-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent-mid loading-dot" />
          <span className="text-[11px] text-text-tertiary ml-0.5">Generating explanation…</span>
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 thin-scrollbar">
        {/* Quote */}
        <div className="bg-accent-light rounded-md px-3.5 py-2.5 border-l-[3px] border-accent-mid">
          <p className="text-[11.5px] text-accent-dark leading-relaxed italic">
            {explanation.quote}
          </p>
        </div>

        {/* Visual */}
        {explanation.visual && (
          <div className="bg-surface-2 border border-border rounded-lg p-3">
            <p className="text-[9.5px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Visual</p>
            <div className="bg-surface rounded-md border border-border p-2.5 flex items-center justify-center">
              {explanation.visual}
            </div>
          </div>
        )}

        {/* Simple explanation */}
        <div className="bg-surface-2 border border-border rounded-lg p-3.5">
          <p className="text-[9.5px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Simple explanation</p>
          <p className="text-[12.5px] leading-[1.75] text-foreground font-light">{explanation.plain}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button className="flex-1 bg-surface border border-border rounded-md px-3 py-2.5 text-[11.5px] text-foreground cursor-pointer transition-colors hover:bg-accent-light hover:border-accent-mid/30 hover:text-accent-dark font-medium text-center">
            Simpler ↓
          </button>
          <button className="flex-1 bg-surface border border-border rounded-md px-3 py-2.5 text-[11.5px] text-foreground cursor-pointer transition-colors hover:bg-accent-light hover:border-accent-mid/30 hover:text-accent-dark font-medium text-center">
            More detail ↑
          </button>
          <button className="flex-1 bg-surface border border-border rounded-md px-3 py-2.5 text-[11.5px] text-foreground cursor-pointer transition-colors hover:bg-accent-light hover:border-accent-mid/30 hover:text-accent-dark font-medium text-center">
            Analogy ↗
          </button>
        </div>
      </div>

      <div className="py-2.5 px-3.5 border-t border-border shrink-0">
        <p className="text-[10px] text-text-tertiary text-center">
          Select any text or tap highlighted text to explain it
        </p>
      </div>
    </div>
  );
};

export default ExplainTab;
