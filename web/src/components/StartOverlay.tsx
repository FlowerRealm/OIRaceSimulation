import { Overlay } from './Overlay';

export interface StartOverlayProps {
  hidden?: boolean;
  userName?: string;
  easyMode?: boolean;
  easyModeTip?: string;
  /** Pulses the challenge button once the player has cleared IOI. */
  challengeHighlighted?: boolean;
  /** Rendered into #challengeSummaryRow, e.g. "已启用：I, II". */
  challengeSummary?: string;
}

const CENTRED_BLOCK = { display: 'block', margin: '8px auto' } as const;

/** Pre-run menu: mode, tutorial, challenge settings, achievements. */
export function StartOverlay({
  hidden = true,
  userName = '',
  easyMode = true,
  easyModeTip = '',
  challengeHighlighted = false,
  challengeSummary = '',
}: StartOverlayProps) {
  return (
    <Overlay id="nameInputOverlay" variant="start-overlay" hidden={hidden}>
      <h2>OI 比赛模拟器</h2>
      <div className="user-bar">
        <span className="user-bar-name">
          👤 <span id="authUserName">{userName}</span>
        </span>
        <button className="user-bar-logout" id="btnLogout">
          退出登录
        </button>
      </div>
      <p style={{ color: '#888', fontSize: '.85rem', marginBottom: 12 }}>选择挑战，开始旅程</p>
      <div className="easy-mode-tip" id="easyModeTip">
        {easyModeTip}
      </div>
      <button
        className={easyMode ? 'easy-mode-btn' : 'easy-mode-btn off'}
        id="btnEasyMode"
        style={CENTRED_BLOCK}
      >
        🌱 简单模式：{easyMode ? '开启' : '关闭'}
      </button>
      <button className="btn-tutorial" id="btnTutorial" style={CENTRED_BLOCK}>
        开始教程
      </button>
      <button className="btn-start-game" id="btnConfirmName">
        开始游戏
      </button>
      <button
        className={challengeHighlighted ? 'btn-challenge-open highlighted' : 'btn-challenge-open'}
        id="btnOpenChallenge"
      >
        挑战设置
      </button>
      <button className="btn-challenge-open" id="btnOpenAchievements">
        🏅成就
      </button>
      <div className="challenge-section">
        <div className="challenge-summary-row" id="challengeSummaryRow">
          {challengeSummary}
        </div>
      </div>
    </Overlay>
  );
}
