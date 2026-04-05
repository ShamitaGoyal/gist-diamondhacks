import type { ExplainVisualPayload } from "@/lib/pdfLensApi";
import { ExplainDiagramSvg } from "./ExplainDiagramSvg";

function sanitizeInlineSvg(svg: string): string {
  const t = svg.trim();
  if (!/^<svg[\s>]/i.test(t)) return "";
  return t
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/\s(on[a-z]+\s*=)/gi, " data-stripped=");
}

function sanitizeHtmlSnippet(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?iframe[^>]*>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\s(on[a-z]+\s*=)/gi, " data-stripped=");
}

function flowchartFromPayload(v: ExplainVisualPayload) {
  return {
    nodes: v.nodes ?? [],
    edges: v.edges ?? [],
  };
}

/** Renders API explain visual by intent: flowchart, raw SVG, HTML table, or nothing. */
export function ExplainVisualRenderer({ visual }: { visual: ExplainVisualPayload }) {
  const k = String(visual.kind ?? "").toLowerCase();

  if (k === "none" || k === "text_only") return null;

  if (k === "table" || k === "html") {
    const raw = visual.html?.trim();
    if (!raw) return null;
    const clean = sanitizeHtmlSnippet(raw);
    return (
      <div
        className="w-full overflow-x-auto text-[11px] max-w-full [&_table]:w-full [&_table]:text-left [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:border-border [&_td]:border-border [&_th]:p-2 [&_td]:p-2 [&_th]:bg-surface-2 [&_th]:font-semibold [&_caption]:text-text-tertiary [&_caption]:text-[10px] [&_caption]:mb-1"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  if (k === "illustrative" || k === "structural" || k === "svg") {
    const raw = visual.svg?.trim();
    if (!raw) return null;
    const clean = sanitizeInlineSvg(raw);
    if (!clean) return null;
    return (
      <div
        className="w-full overflow-x-auto flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }

  if (k === "flowchart" || k === "steps" || k === "sequence") {
    const { nodes, edges } = flowchartFromPayload(visual);
    if (nodes.length === 0) {
      const fallbackSvg = visual.svg?.trim();
      if (fallbackSvg) {
        const clean = sanitizeInlineSvg(fallbackSvg);
        if (clean) {
          return (
            <div
              className="w-full overflow-x-auto flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: clean }}
            />
          );
        }
      }
      return null;
    }
    return <ExplainDiagramSvg visual={{ nodes, edges }} />;
  }

  if (visual.svg?.trim()) {
    const clean = sanitizeInlineSvg(visual.svg);
    if (clean) {
      return (
        <div
          className="w-full overflow-x-auto flex justify-center [&_svg]:max-w-full [&_svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      );
    }
  }
  if (visual.html?.trim()) {
    const clean = sanitizeHtmlSnippet(visual.html);
    return (
      <div
        className="w-full overflow-x-auto text-[11px] max-w-full [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_th]:bg-surface-2"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    );
  }
  if ((visual.nodes?.length ?? 0) > 0) {
    return <ExplainDiagramSvg visual={flowchartFromPayload(visual)} />;
  }

  return null;
}

export function explainVisualKindLabel(kind: string | undefined): string {
  switch (String(kind ?? "").toLowerCase()) {
    case "flowchart":
    case "steps":
    case "sequence":
      return "Flow";
    case "illustrative":
      return "Illustration";
    case "structural":
      return "Structure";
    case "table":
    case "html":
      return "Comparison";
    case "svg":
      return "Diagram";
    default:
      return "Visual";
  }
}
