/** Mock “story mode” insight + concept weights for the mini lens speech bubble. */

export interface MiniLensConcept {
  label: string;
  /** 0–100 for bar length */
  value: number;
}

export interface MiniLensInsight {
  story: string;
  concepts: MiniLensConcept[];
}

function clip(s: string, n: number) {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function hashPick<T>(text: string, options: T[]): T {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length];
}

export async function mockMiniLensInsight(selectedText: string): Promise<MiniLensInsight> {
  await new Promise((r) => setTimeout(r, 280));
  const snippet = clip(selectedText, 52);
  const analogy = hashPick(selectedText, [
    `Think of this passage like a 🧭 compass needle: it orients you toward what the authors care about most before you read the fine print.`,
    `This bit is like a 🧱 foundation block—it’s load-bearing for the argument that follows, not decorative.`,
    `Reading this is like checking a 🔀 switchboard: it routes “who does what” between ideas or roles in the paper.`
  ]);

  const story = `${analogy}\n\nWhy it matters: “${snippet}” anchors a claim the paper needs you to accept. If you skim past it, later sections feel unmotivated—pause here and decide whether you buy the framing.`;

  const lower = selectedText.toLowerCase();
  const concepts: MiniLensConcept[] = [];
  if (/\b(design|interface|ui|user|stakeholder)\b/.test(lower)) {
    concepts.push({ label: 'Human factors', value: 88 });
    concepts.push({ label: 'System structure', value: 72 });
    concepts.push({ label: 'Evidence density', value: 54 });
  } else if (/\b(method|result|experiment|evaluation)\b/.test(lower)) {
    concepts.push({ label: 'Method clarity', value: 82 });
    concepts.push({ label: 'Empirical weight', value: 76 });
    concepts.push({ label: 'Generalization', value: 48 });
  } else {
    concepts.push({ label: 'Core claim', value: 85 });
    concepts.push({ label: 'Definitions', value: 68 });
    concepts.push({ label: 'Open questions', value: 42 });
  }
  concepts.push({ label: 'Read time cost', value: Math.min(95, 35 + (selectedText.length % 40)) });

  return { story, concepts };
}

function hashToIndex(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}

/** Demo assistant for mini lens — no backend; varied, selection-aware examples. */
export async function mockMiniLensChatReply(userMessage: string, selectionSnippet: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 320));
  const s = userMessage.toLowerCase().trim();
  const snip = clip(selectionSnippet, 48);
  const snipShort = clip(selectionSnippet, 32);

  if (!s) {
    return `Ask me anything about “${snipShort}”—for example why it matters, how it connects to the rest of the paper, or what to skim next.`;
  }

  if (/\b(hello|hi|hey)\b/.test(s)) {
    return `Hi — I’m a demo helper anchored on your highlight (“${snipShort}”). What would you like to unpack: intent, definitions, or how this section supports the main claim?`;
  }

  if (/\b(thanks|thank you|ty)\b/.test(s)) {
    return `You’re welcome. If you open the full Lens, you can map the argument or run a deeper compile on the same selection.`;
  }

  if (/\b(why|matter|important|signif|point|purpose)\b/.test(s)) {
    return `For “${snip}”, the authors are usually signaling stakes: what breaks (for users, systems, or theory) if you ignore this bit. Ask yourself what claim would feel weaker without this sentence.`;
  }

  if (/\b(how|connect|relate|link|fit|follow|next)\b/.test(s)) {
    return `Trace two hops: (1) scroll up to the nearest term they define or motivate, (2) scroll down to the first figure, evaluation, or design artifact that exercises this idea. That path is the paper’s thread for this highlight.`;
  }

  if (/\b(what|define|meaning|mean)\b/.test(s)) {
    return `In plain language, this passage is packaging a technical idea so you accept a specific framing—often by naming actors, constraints, or outcomes. Re-read for nouns that carry hidden assumptions (e.g. “malleable,” “pipeline,” “stakeholder”).`;
  }

  if (/\b(who|authors?|paper)\b/.test(s)) {
    return `The voice here is the paper’s: they’re telling you what problem exists and what their artifact (framework, method, or study) is meant to change. Your snippet is doing rhetorical work toward that promise.`;
  }

  if (/\b(example|instance|e\.g\.|like)\b/.test(s)) {
    return `Example angle: imagine a reader who only remembers one sentence from this section—it should be the one that justifies why the next section isn’t optional. Your highlight is a good candidate if it names the pain or the proposed fix.`;
  }

  if (/\b(summar|tl;dr|tldr|short)\b/.test(s)) {
    return `TL;DR for “${snipShort}”: it narrows the reader from “interfaces exist” to “this class of interfaces needs shared specs so designers, devs, and users can co-evolve them.” Everything else is evidence or tooling toward that.`;
  }

  if (/\b(critic|weak|limit|problem|wrong)\b/.test(s)) {
    return `Demo critique: check whether this statement is backed by a citation, a study, or a demo in the next pages. If it’s pure vision, treat it as a design goal—not yet a finding—until you see evaluation.`;
  }

  const fallbacks = [
    `On “${snipShort}”: one concrete read is that it’s doing boundary work—carving out what’s in scope for the paper’s contribution versus prior UI practice.`,
    `If you’re stuck, try rephrasing the highlight as “We argue X because Y.” If Y is missing in the next two paragraphs, flag it when you use the full Lens Critique tab.`,
    `Relative to your selection: underline the strongest verb. In demo mode I’d bet that verb is doing the argumentative heavy lifting—often “enable,” “reduce,” or “formalize.”`,
    `Quick exercise: replace jargon in your highlight with a one-line user story (“As a ___, I need ___ so that ___”). If that story feels forced, the sentence may be setup rather than takeaway.`
  ];
  return fallbacks[hashToIndex(userMessage + selectionSnippet, fallbacks.length)];
}

/** Full Lens Chat: mock answers using zero or more PDF excerpts the user pinned. */
export async function mockLensEditorChatReply(userMessage: string, snippets: string[]): Promise<string> {
  const combined =
    snippets.length > 0
      ? snippets.join('\n\n---\n\n').slice(0, 520)
      : 'Meridian / malleable overview-detail interfaces (pin highlights with “Add to chat” for tighter answers).';
  const prefix =
    snippets.length > 1
      ? `Across your ${snippets.length} linked highlights:\n\n`
      : snippets.length === 1
        ? 'Using your linked highlight:\n\n'
        : '';
  const body = await mockMiniLensChatReply(userMessage, combined);
  return `${prefix}${body}`;
}
