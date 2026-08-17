export type MapButtonState = 'idle' | 'active' | 'win' | 'lose';

export interface MapButtonProps {
  label: string;
  state?: MapButtonState;
  /** Green outline the engine adds once the correct path has been found. */
  correctFound?: boolean;
  onClick?: () => void;
}

/** One problem selector button above the canvas. */
export function MapButton({ label, state = 'idle', correctFound = false, onClick }: MapButtonProps) {
  const className = ['map-btn', state !== 'idle' && state, correctFound && 'correct-found']
    .filter(Boolean)
    .join(' ');
  return (
    <button className={className} onClick={onClick}>
      {label}
    </button>
  );
}
