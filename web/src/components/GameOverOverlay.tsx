import type { ReactNode } from 'react';
import { Overlay } from './Overlay';

export type RunOutcome = 'win' | 'partial' | 'lose';

export interface GameOverOverlayProps {
  hidden?: boolean;
  outcome?: RunOutcome;
  title?: string;
  text?: string;
  /** The engine fills these four slots with generated tables. */
  scoreSummary?: ReactNode;
  challengesUsed?: ReactNode;
  history?: ReactNode;
  /** Replaces the default reset button when the run can be continued. */
  buttons?: ReactNode;
}

/**
 * End-of-run report. The outcome only picks the heading colour.
 *
 * `outcome` is opt-in because the engine never sets it: the .win-title /
 * .lose-title / .partial-title rules exist in the stylesheet but nothing has
 * ever applied them. Leaving it undefined reproduces the shipped markup exactly.
 */
export function GameOverOverlay({
  hidden = true,
  outcome,
  title = '',
  text = '',
  scoreSummary,
  challengesUsed,
  history,
  buttons,
}: GameOverOverlayProps) {
  return (
    <Overlay id="gameOverOverlay" hidden={hidden}>
      <h2 id="modalTitle" className={outcome ? `${outcome}-title` : undefined}>
        {title}
      </h2>
      <p id="modalText">{text}</p>
      <div id="modalScoreSummary">{scoreSummary}</div>
      <div id="modalChallengesUsed">{challengesUsed}</div>
      <div id="modalHistory">{history}</div>
      <div id="modalButtons">
        {buttons ?? (
          <button className="btn btn-restart" id="btnModalRestart">
            🔄完全重置
          </button>
        )}
      </div>
    </Overlay>
  );
}
