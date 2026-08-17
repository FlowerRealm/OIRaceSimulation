import { Fragment } from 'react';
import { Overlay } from './Overlay';
import { ChallengeGroup, type ChallengeState } from './ChallengeGroup';
import { CHALLENGE_GROUPS } from '../data/challenges';

export interface ChallengeOverlayProps {
  hidden?: boolean;
  state?: ChallengeState;
  /** True once the player has taken IOI gold outside simple mode. */
  ioiCleared?: boolean;
  onToggle?: (key: string) => void;
  onConfirm?: () => void;
}

const WARNING_PENDING = '⚠️ 如果你还没有在非简单模式下通关过游戏拿到IOI金牌，那么建议你先通关游戏';
const WARNING_CLEARED = '✅ 你已在非简单模式下获得IOI金牌，可以挑战了';

/** The challenge-settings dialog: every difficulty modifier, grouped by tier. */
export function ChallengeOverlay({
  hidden = true,
  state = {},
  ioiCleared = false,
  onToggle,
  onConfirm,
}: ChallengeOverlayProps) {
  return (
    <Overlay id="challengeOverlay" variant="challenge-overlay-bg" hidden={hidden}>
      <h2>⚡挑战设置</h2>
      <div className="challenge-warning" id="challengeWarning">
        {ioiCleared ? WARNING_CLEARED : WARNING_PENDING}
      </div>
      <p style={{ color: '#888', fontSize: '.8rem', marginBottom: 12 }}>点击挑战项切换</p>
      {CHALLENGE_GROUPS.map((group, i) => (
        <Fragment key={group.groupId}>
          {i > 0 && <hr className="challenge-tier-divider" />}
          <ChallengeGroup group={group} state={state} onToggle={onToggle} />
        </Fragment>
      ))}
      <button className="btn-confirm" id="btnConfirmChallenge" onClick={onConfirm}>
        ✅确认
      </button>
    </Overlay>
  );
}
