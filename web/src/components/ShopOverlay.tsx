import type { ReactNode } from 'react';
import { Overlay } from './Overlay';

export interface ShopOverlayProps {
  hidden?: boolean;
  skillPoints?: number | string;
  /** Floating "+n sp" the engine fades in after a run. */
  spEarned?: string;
  /** Upgrade and stock lists; the engine fills #shopLeftContent. */
  left?: ReactNode;
  nextMatch?: ReactNode;
  personal?: ReactNode;
  leaderboard?: ReactNode;
  tips?: ReactNode;
}

const MUTED = { fontSize: '.7rem', color: '#555' } as const;
const RIGHT_TITLE = { fontSize: '.78rem' } as const;

/** Between-contest shop: upgrades on the left, previews and leaderboard on the right. */
export function ShopOverlay({
  hidden = true,
  skillPoints = 0,
  spEarned,
  left,
  nextMatch,
  personal,
  leaderboard,
  tips,
}: ShopOverlayProps) {
  return (
    <Overlay id="shopOverlay" variant="shop-overlay-bg" hidden={hidden}>
      <h2 className="skill-title">🏪商店</h2>
      <p className="skill-points-display">
        💎技能点:<span id="shopSkillPoints">{skillPoints}</span>
        <span
          id="shopSpEarned"
          className="sp-earned-display"
          style={spEarned ? undefined : { display: 'none' }}
        >
          {spEarned}
        </span>
      </p>

      <div className="shop-layout">
        <div className="shop-left">
          <div id="shopLeftContent">{left}</div>
        </div>
        <div className="shop-right">
          <div className="shop-preview-section" id="shopPreviewSection">
            <div className="shop-right-title" style={RIGHT_TITLE}>
              📋 下一场比赛预览
            </div>
            <div id="shopPreviewNextMatch" style={{ ...MUTED, textAlign: 'center' }}>
              {nextMatch}
            </div>
            <div style={{ borderTop: '1px dashed #ddd', margin: '6px 0' }} />
            <div className="shop-right-title" style={RIGHT_TITLE}>
              👤 个人信息
            </div>
            <div id="shopPreviewPersonal" style={MUTED}>
              {personal}
            </div>
          </div>

          <div className="leaderboard-section">
            <div className="shop-right-title" style={RIGHT_TITLE}>
              🏅 排行榜
            </div>
            <div id="leaderboardList" style={MUTED}>
              {leaderboard}
            </div>
            <button className="btn-export" id="btnExportLB">
              📤导出我的记录(.json)
            </button>
          </div>

          <div id="shopTipsPanel" className="shop-tips-panel">
            {tips}
          </div>
        </div>
      </div>

      <button className="btn-continue" id="btnCloseShop">
        ▶继续下一关
      </button>
    </Overlay>
  );
}
