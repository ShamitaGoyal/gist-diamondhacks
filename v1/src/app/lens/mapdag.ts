export interface MapDAGNode {
  id: string;
  label: string;
  type: 'thesis' | 'method' | 'finding';
  x: number;
  y: number;
  children?: string[];
  /** Matches `data-lens-section` / `#section-{id}` in the PDF lens. */
  sectionId?: string;
}
