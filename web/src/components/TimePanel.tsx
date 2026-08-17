export interface TimePanelProps {
  /** Remaining time, the large number on the right. */
  time?: number | string;
  /** Fill fraction of the time bar, 0..1. */
  timeFraction?: number;
  /** Fill fraction of the stamina bar, 0..1. */
  staminaFraction?: number;
  /** Stamina cap printed after the slash. */
  staminaRef?: number | string;
  /** Engine turns this on when time is nearly out. */
  danger?: boolean;
  ticking?: boolean;
}

const pct = (fraction: number) => `${Math.max(0, Math.min(1, fraction)) * 100}%`;

/** Stamina and time bars. #timeBarInner, #staminaBar and #timeNumber are engine-driven. */
export function TimePanel({
  time = 0,
  timeFraction = 0,
  staminaFraction = 0,
  staminaRef = 20,
  danger = false,
  ticking = false,
}: TimePanelProps) {
  const numberClass = ['time-number', danger && 'danger', ticking && 'tick'].filter(Boolean).join(' ');
  return (
    <div className="time-panel">
      <span className="time-icon">⏱️</span>
      <span className="time-label">精力/时间</span>
      <div className="time-bars-group">
        <div className="time-bar-outer" id="staminaBarOuter">
          <div className="stamina-bar" id="staminaBar" style={{ width: pct(staminaFraction) }} />
        </div>
        <div className="time-bar-outer" id="timeBarOuter">
          <div
            className={danger ? 'time-bar-inner danger' : 'time-bar-inner'}
            id="timeBarInner"
            style={{ width: pct(timeFraction) }}
          />
        </div>
      </div>
      <span className={numberClass} id="timeNumber">
        {time}
      </span>
      <span style={{ fontSize: '.7rem', color: '#888' }}>
        /精力<span id="staminaRef">{staminaRef}</span>
      </span>
    </div>
  );
}
