export type StockKind = 'time' | 'mind' | 'boost' | 'inspire';

export interface StockRowProps {
  kind: StockKind;
  count?: number;
  /** Bar fill fraction, 0..1. The engine scales every row against the largest count. */
  fraction?: number;
  /** Overrides the generated element ids. Only the app needs these. */
  countId?: string;
  barId?: string;
}

const STOCK_META: Record<StockKind, { icon: string; name: string; fill: string }> = {
  time: { icon: '⏰', name: '时间', fill: 'time-fill' },
  mind: { icon: '🧠', name: '思维', fill: 'mind-fill' },
  boost: { icon: '💠', name: '提升', fill: 'boost-fill' },
  inspire: { icon: '⚡', name: '振奋', fill: 'inspire-fill' },
};

/**
 * One upgrade-stock row in the side panel.
 *
 * The four rows in the original markup were copy-pasted blocks differing only by
 * icon, label and fill colour; they are one component and a lookup table here.
 */
export function StockRow({ kind, count = 0, fraction = 0, countId, barId }: StockRowProps) {
  const meta = STOCK_META[kind];
  const width = `${Math.max(0, Math.min(1, fraction)) * 100}%`;
  return (
    <div className="side-stock-row">
      <span className="side-stock-icon">{meta.icon}</span>
      <span className="side-stock-name">{meta.name}</span>
      <span className="side-stock-count" id={countId}>
        {count}
      </span>
      <div className="side-stock-bar">
        <div className={`side-stock-fill ${meta.fill}`} id={barId} style={{ width }} />
      </div>
    </div>
  );
}
