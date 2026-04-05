/** Screen-space anchor inside the PDF scroll container (mock HTML lens). */
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionAnchor {
  pageNumber: number;
  rect: SelectionRect;
  sectionId: string | null;
}

