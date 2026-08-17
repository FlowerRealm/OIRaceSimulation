import type { ReactNode } from 'react';
import { FocusButton } from './FocusButton';
import { StockRow, type StockKind } from './StockRow';

export interface SidePanelProps {
  mind?: number | string;
  /** Focus stacks shown as "+n". Zero hides the badge, as the engine does. */
  focusStacks?: number;
  focusStatusText?: string;
  focusButtonHidden?: boolean;
  stocks?: Partial<Record<StockKind, number>>;
  /** Session achievements list; the engine fills #sessionAchievementsList. */
  achievements?: ReactNode;
  onShowAchievements?: () => void;
}

const SECTION_STYLE = { borderTop: '1px solid #eee', paddingTop: 6 } as const;
const SECTION_TITLE_STYLE = {
  fontWeight: 700,
  fontSize: '.78rem',
  color: '#555',
  textAlign: 'center',
  marginBottom: 4,
} as const;

const STOCK_IDS: Record<StockKind, { countId: string; barId: string }> = {
  time: { countId: 'sideTimeStock', barId: 'sideTimeStockBar' },
  mind: { countId: 'sideMindStock', barId: 'sideMindStockBar' },
  boost: { countId: 'sideBoostStock', barId: 'sideBoostStockBar' },
  inspire: { countId: 'sideInspireStock', barId: 'sideInspireStockBar' },
};

const STOCK_ORDER: StockKind[] = ['time', 'mind', 'boost', 'inspire'];

/** Attributes, upgrade stock and session achievements, to the right of the board. */
export function SidePanel({
  mind = 4,
  focusStacks = 0,
  focusStatusText = '未解锁',
  focusButtonHidden = true,
  stocks = {},
  achievements,
  onShowAchievements,
}: SidePanelProps) {
  // The engine scales every bar against the largest stock, never against a fixed
  // cap, so a lone stock of 1 still fills its bar.
  const counts = STOCK_ORDER.map((kind) => stocks[kind] ?? 0);
  const maxStock = Math.max(...counts, 1);

  return (
    <div className="side-panel" id="sidePanel">
      <div className="side-panel-title">🧠属性面板</div>

      <div className="side-attr-row">
        <span className="side-attr-label">🧠思维</span>
        <span className="side-attr-value" id="sideMindValue">
          {mind}
        </span>
        <span
          className="attr-focus-bonus"
          id="sideFocusBonus"
          style={focusStacks > 0 ? { display: 'inline-block' } : { display: 'none' }}
        >
          +{focusStacks}
        </span>
      </div>

      <div className="side-attr-row">
        <span className="side-attr-label">👁️凝聚</span>
        <FocusButton id="btnFocusSide" cost="" hidden={focusButtonHidden} />
        <span style={{ fontSize: '.7rem', color: '#888' }} id="focusStatusText">
          {focusStatusText}
        </span>
      </div>

      <div style={{ ...SECTION_STYLE, marginTop: 2 }}>
        <div style={SECTION_TITLE_STYLE}>📦升级存量</div>
        {STOCK_ORDER.map((kind, i) => (
          <StockRow
            key={kind}
            kind={kind}
            count={counts[i]}
            fraction={counts[i] / maxStock}
            countId={STOCK_IDS[kind].countId}
            barId={STOCK_IDS[kind].barId}
          />
        ))}
      </div>

      <div style={{ ...SECTION_STYLE, marginTop: 4 }}>
        <div style={SECTION_TITLE_STYLE}>🏅本次成就</div>
        <div id="sessionAchievementsList" style={{ fontSize: '.7rem', color: '#666' }}>
          {achievements}
        </div>
        <button
          id="btnShowAchievements"
          style={{
            background: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '3px 8px',
            fontSize: '.65rem',
            cursor: 'pointer',
            marginTop: 4,
          }}
          onClick={onShowAchievements}
        >
          查看全部
        </button>
      </div>
    </div>
  );
}
