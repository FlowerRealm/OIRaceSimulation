import type { ReactNode } from 'react';

export interface AttrsPanelProps {
  children?: ReactNode;
}

/** Per-run attribute readout above the board. The engine fills #attrsPanel. */
export function AttrsPanel({ children }: AttrsPanelProps) {
  return (
    <div className="attrs-panel" id="attrsPanel">
      {children}
    </div>
  );
}
