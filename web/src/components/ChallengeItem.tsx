export type ChallengeKind = 'normal' | 'exp' | 'fun' | 'assist';
export type ChallengeTier = 1 | 2 | 3;

export interface ChallengeItemProps {
  name: string;
  desc: string;
  kind?: ChallengeKind;
  /** Which difficulty group a `normal` challenge belongs to; drives its lit colour. */
  tier?: ChallengeTier;
  on?: boolean;
  /**
   * `normal` only: this tier's EXP challenge is active, so the individual
   * challenge is subsumed by it and renders struck through instead of lit.
   */
  expOverride?: boolean;
  /** `exp` only: all same-tier challenges are on, so this one may be switched on. */
  canActivate?: boolean;
  /** Extra hint line, used by the EXP items to explain their unlock rule. */
  expTip?: string;
  /** Renders the ⓘ affordance next to the name. */
  tipId?: string;
  id?: string;
  badgeId?: string;
  dataCh?: string;
  onClick?: () => void;
}

interface Presentation {
  itemClasses: string[];
  badgeClass: string;
  badgeLabel: string;
}

/**
 * Collapses the four separate class-juggling loops in the engine into one
 * derivation. Everything a challenge row can look like is a function of
 * (kind, tier, on, expOverride, canActivate) and nothing else.
 */
function present({ kind, tier, on, expOverride, canActivate }: Required<
  Pick<ChallengeItemProps, 'kind' | 'on'>
> &
  Pick<ChallengeItemProps, 'tier' | 'expOverride' | 'canActivate'>): Presentation {
  switch (kind) {
    case 'exp':
      return {
        itemClasses: ['exp-item', on ? 'exp-active' : !canActivate ? 'exp-locked' : ''],
        badgeClass: on ? 'exp-on' : canActivate ? 'exp-off' : 'exp-locked',
        badgeLabel: on ? '已激活' : canActivate ? '可激活' : '锁定',
      };
    case 'fun':
      return {
        itemClasses: ['fun-item', on ? 'fun-active' : ''],
        badgeClass: on ? 'fun-on' : 'fun-off',
        badgeLabel: on ? '开启' : '关闭',
      };
    case 'assist':
      return {
        itemClasses: ['assist-item', on ? 'assist-active' : ''],
        badgeClass: on ? 'assist-on' : 'assist-off',
        badgeLabel: on ? '开启' : '关闭',
      };
    default:
      return {
        itemClasses: [
          on ? 'manual-enabled' : '',
          expOverride ? 'exp-override' : on && tier ? `tier${tier}-on` : '',
        ],
        badgeClass: on ? 'on' : 'off',
        badgeLabel: on ? '开启' : '关闭',
      };
  }
}

/** One row in the challenge-settings modal. */
export function ChallengeItem({
  name,
  desc,
  kind = 'normal',
  tier,
  on = false,
  expOverride = false,
  canActivate = false,
  expTip,
  tipId,
  id,
  badgeId,
  dataCh,
  onClick,
}: ChallengeItemProps) {
  const { itemClasses, badgeClass, badgeLabel } = present({ kind, tier, on, expOverride, canActivate });
  const className = ['challenge-item', ...itemClasses].filter(Boolean).join(' ');

  return (
    <div className={className} id={id} data-ch={dataCh} onClick={onClick}>
      <div className="challenge-info">
        <div className="challenge-name">
          {name}
          {tipId && (
            <span className="challenge-info-tip" id={tipId}>
              ⓘ
            </span>
          )}
        </div>
        <div className="challenge-desc">{desc}</div>
        {expTip && <div className="exp-tip-text">{expTip}</div>}
      </div>
      <span className={`challenge-status-badge ${badgeClass}`} id={badgeId}>
        {badgeLabel}
      </span>
    </div>
  );
}
