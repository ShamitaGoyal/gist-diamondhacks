/** SVG filter defs for a hand-drawn / Rough.js–like effect on icons (Story mode). */
export function RoughSvgDefs() {
  return (
    <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
      <defs>
        <filter id="lens-roughen-icons" x="-35%" y="-35%" width="170%" height="170%">
          <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
