export interface FocusButtonProps {
  /** Unlocked but not currently applied. */
  active?: boolean;
  /** Not yet bought in the shop. */
  locked?: boolean;
  /** Stamina cost badge rendered by the .has-cost::after rule. Empty hides it. */
  cost?: string;
  hidden?: boolean;
  id?: string;
  onClick?: () => void;
}

/** The 👁️ focus toggle in the side panel's attribute rows. */
export function FocusButton({ active, locked, cost = '', hidden, id, onClick }: FocusButtonProps) {
  const className = ['focus-btn-inline', active && 'active', locked && 'locked', cost && 'has-cost']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      id={id}
      className={className}
      title="聚焦"
      data-cost={cost}
      style={hidden ? { display: 'none' } : undefined}
      onClick={onClick}
    >
      👁️
    </button>
  );
}
