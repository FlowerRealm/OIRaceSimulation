import type { ReactNode } from 'react';
import { Overlay } from './Overlay';

export interface LeaderboardOverlayProps {
  hidden?: boolean;
  /** One line explaining what the board on screen ranks. */
  pageNote?: string;
  /** The engine fills #lbTabs — 总榜 first, then one tab per level. */
  tabs?: ReactNode;
  /** The engine fills #leaderboardBoard with whichever board is selected. */
  children?: ReactNode;
}

/**
 * The boards, opened from the start screen, one tab each.
 *
 * 总榜 ranks whole runs by weighted total; every tab after it is one level's
 * 单场榜. They share a ranking rule — score first, elapsed time second — so the
 * tabs are slices of one board rather than competing ideas of who is winning.
 *
 * The header row belongs to the board, not to this shell: the two kinds rank
 * different things and label their columns differently.
 */
export function LeaderboardOverlay({
  hidden = true,
  pageNote = '每位玩家的最佳一局，点击一行展开这局每场比赛的分数与用时。',
  tabs,
  children,
}: LeaderboardOverlayProps) {
  return (
    <Overlay id="leaderboardOverlay" hidden={hidden} modalClassName="leaderboard-modal">
      <h2>🏆排行榜</h2>
      <div className="lb-tabs" id="lbTabs">
        {tabs}
      </div>
      <div className="lb-note" id="lbPageNote">
        {pageNote}
      </div>
      <div className="leaderboard-full-list" id="leaderboardBoard">
        {children}
      </div>
      <button className="btn-confirm" id="btnCloseLeaderboard">
        关闭
      </button>
    </Overlay>
  );
}
