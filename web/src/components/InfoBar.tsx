export interface InfoBarProps {
  mapIndex?: number | string;
  totalMaps?: number | string;
  unlockedCount?: number | string;
  maxScore?: number | string;
  /** Shows the "correct path found" hint the engine reveals mid-map. */
  correctFound?: boolean;
}

/**
 * Node-colour legend plus the run counters under the canvas.
 *
 * `process` carries no styles of its own — the base .legend-dot rule covers it —
 * but it is kept so the markup still reads as one entry per node kind.
 */
const LEGEND: Array<{ dot: string; label: string }> = [
  { dot: 'process', label: '过程' },
  { dot: 'important', label: '重要' },
  { dot: 'result', label: '结果' },
  { dot: 'skill-node', label: '技能点' },
  { dot: 'check-ring', label: '可检查' },
  { dot: 'correct-box', label: '正确' },
  { dot: 'broken', label: '错误' },
  { dot: 'upgrade-node', label: '升级存量' },
];

export function InfoBar({
  mapIndex = 1,
  totalMaps = 4,
  unlockedCount = 0,
  maxScore = '-',
  correctFound = false,
}: InfoBarProps) {
  return (
    <div className="info-bar">
      <div className="legend">
        {LEGEND.map(({ dot, label }) => (
          <span className="legend-item" key={dot}>
            <span className={`legend-dot ${dot}`} />
            {label}
          </span>
        ))}
      </div>
      <div>
        题目<span id="mapIndexDisplay">{mapIndex}</span>/<span id="totalMapsDisplay">{totalMaps}</span> | 解锁
        <span id="unlockedCount">{unlockedCount}</span> | 最高分<span id="maxScoreDisplay">{maxScore}</span>
        <span
          id="correctFoundHint"
          className="correct-found-hint"
          style={correctFound ? undefined : { display: 'none' }}
        >
          ✅正确路径已找到
        </span>
      </div>
    </div>
  );
}
