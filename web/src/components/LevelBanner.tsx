export type LevelBannerVariant = 'normal' | 'sim' | 'final';

export interface LevelBannerProps {
  /** Contest name, e.g. "NOIP 普及组". Empty in the app's first paint. */
  levelName?: string;
  /** Stamina cap shown in the badge. */
  stamina?: number | string;
  variant?: LevelBannerVariant;
}

/**
 * The contest header above the tree canvas.
 *
 * The ids here are load-bearing: the game engine writes #levelName and
 * #staminaDisplay directly, so the props below only supply the first paint.
 */
export function LevelBanner({ levelName = '', stamina = 20, variant = 'normal' }: LevelBannerProps) {
  const className = variant === 'normal' ? 'level-banner' : `level-banner ${variant}`;
  return (
    <div className={className} id="levelBanner">
      🏆 <span id="levelName">{levelName}</span>{' '}
      <span className="stamina-badge">
        💪精力:<span id="staminaDisplay">{stamina}</span>
      </span>
    </div>
  );
}
