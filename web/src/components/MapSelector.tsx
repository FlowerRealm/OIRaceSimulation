import type { ReactNode } from 'react';

export interface MapSelectorProps {
  children?: ReactNode;
}

/**
 * Row of problem buttons plus the manual-complete action.
 * The engine rebuilds #mapSelector from scratch on every level change.
 */
export function MapSelector({ children }: MapSelectorProps) {
  return (
    <div className="map-selector" id="mapSelector">
      {children}
    </div>
  );
}
