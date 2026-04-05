export type SemanticMarkerType = 'evidence' | 'claim' | 'definition';

export interface SemanticMarker {
  position: number;
  type: SemanticMarkerType;
}

interface SemanticScrollbarProps {
  markers: SemanticMarker[];
}

export function SemanticScrollbar({ markers }: SemanticScrollbarProps) {
  const getMarkerColor = (type: SemanticMarkerType) => {
    switch (type) {
      case 'evidence':
        return '#0D9488';
      case 'claim':
        return '#EA580C';
      case 'definition':
        return '#6366F1';
    }
  };

  return (
    <div
      className="fixed bottom-0 right-0 top-14 w-3 border-l"
      style={{ backgroundColor: 'var(--lens-surface-2)', borderColor: 'var(--lens-border)' }}
      title="Semantic rail (definitions · claims · evidence)"
    >
      <div className="relative h-full">
        {markers.length === 0 ? (
          <p
            className="absolute left-0 right-0 top-2 px-0.5 text-center text-[7px] leading-tight text-[var(--lens-muted)]"
            style={{ fontFamily: 'var(--lens-font-mono)' }}
          >
            —
          </p>
        ) : null}
        {markers.map((marker, index) => (
          <div
            key={index}
            className="absolute left-1 h-1 w-1 rounded-sm"
            style={{
              top: `${marker.position}%`,
              backgroundColor: getMarkerColor(marker.type)
            }}
            title={marker.type}
          />
        ))}
      </div>
    </div>
  );
}
