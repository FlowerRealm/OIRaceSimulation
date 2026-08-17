export interface ScoreBarProps {
  score?: number;
  total?: number;
  /** Adds the tick animation class the engine toggles when the score changes. */
  ticking?: boolean;
}

/** Total-score progress bar. #scoreBarInner and #scoreNumber are engine-driven. */
export function ScoreBar({ score = 0, total = 400, ticking = false }: ScoreBarProps) {
  const pct = total > 0 ? Math.min(100, (score / total) * 100) : 0;
  return (
    <div className="score-progress-panel">
      <span className="score-progress-label">📊总分</span>
      <div className="score-bar-outer">
        <div className="score-bar-inner" id="scoreBarInner" style={{ width: `${pct}%` }} />
      </div>
      <span className={ticking ? 'score-number tick' : 'score-number'} id="scoreNumber">
        {score}/{total}
      </span>
    </div>
  );
}
