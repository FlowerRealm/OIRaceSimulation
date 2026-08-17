import type { ReactNode } from 'react';

export type OverlayVariant = 'plain' | 'start-overlay' | 'challenge-overlay-bg' | 'shop-overlay-bg';

export interface OverlayProps {
  id?: string;
  variant?: OverlayVariant;
  /** The engine shows and hides overlays by toggling `.hidden`. */
  hidden?: boolean;
  /** Extra classes for the inner modal, e.g. `achievement-modal`. */
  modalClassName?: string;
  children?: ReactNode;
}

/** Full-screen scrim wrapping a centred modal. Every dialog in the game uses it. */
export function Overlay({
  id,
  variant = 'plain',
  hidden = false,
  modalClassName,
  children,
}: OverlayProps) {
  const className = ['overlay', variant !== 'plain' && variant, hidden && 'hidden']
    .filter(Boolean)
    .join(' ');
  return (
    <div className={className} id={id}>
      <div className={modalClassName ? `modal ${modalClassName}` : 'modal'}>{children}</div>
    </div>
  );
}
