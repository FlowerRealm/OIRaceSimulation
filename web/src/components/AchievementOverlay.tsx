import type { ReactNode } from 'react';
import { Overlay } from './Overlay';

export interface AchievementOverlayProps {
  hidden?: boolean;
  /** Achievements are tracked separately for the two difficulty modes. */
  mode?: 'normal' | 'simple';
  /** The engine fills #achievementList. */
  children?: ReactNode;
}

/** Full achievement list, split by difficulty mode. */
export function AchievementOverlay({
  hidden = true,
  mode = 'normal',
  children,
}: AchievementOverlayProps) {
  return (
    <Overlay id="achievementOverlay" hidden={hidden} modalClassName="achievement-modal">
      <h2>🏅成就</h2>
      <div style={{ fontSize: '.75rem', color: '#666', marginBottom: 8 }}>
        导出/导入排行榜会同时包含成就记录
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        <button
          className={mode === 'normal' ? 'achievement-toggle-btn active' : 'achievement-toggle-btn'}
          id="achModeNormal"
        >
          正常模式
        </button>
        <button
          className={mode === 'simple' ? 'achievement-toggle-btn active' : 'achievement-toggle-btn'}
          id="achModeSimple"
        >
          简单模式
        </button>
      </div>
      <div className="achievement-list" id="achievementList">
        {children}
      </div>
      <button className="btn-confirm" id="btnCloseAchievements">
        关闭
      </button>
    </Overlay>
  );
}
