import type { Meta, StoryObj } from '@storybook/react-vite';
import { AchievementOverlay } from '../components/AchievementOverlay';
import { AuthOverlay } from '../components/AuthOverlay';
import { GameOverOverlay } from '../components/GameOverOverlay';
import { LeaderboardOverlay } from '../components/LeaderboardOverlay';
import { StartOverlay } from '../components/StartOverlay';
import { onGameBackground } from './decorators';

/**
 * The dialogs that bracket a run. They share one story file because they share
 * one shell — Overlay + .modal — and differ only in what they put inside it.
 */
const meta = {
  title: 'Overlays/Dialogs',
  decorators: [onGameBackground],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {
  render: () => <AuthOverlay />,
};

export const Register: Story = {
  render: () => <AuthOverlay mode="register" />,
};

export const SignInFailed: Story = {
  render: () => <AuthOverlay error="用户名或密码错误" />,
};

export const StartMenu: Story = {
  render: () => <StartOverlay hidden={false} userName="realm" challengeSummary="未启用" />,
};

/** After clearing IOI the challenge button pulses to advertise the harder modes. */
export const StartMenuAfterClear: Story = {
  render: () => (
    <StartOverlay
      hidden={false}
      userName="realm"
      easyMode={false}
      easyModeTip="简单模式下的成绩不计入正常模式成就"
      challengeHighlighted
      challengeSummary="已启用：I, II, III, I-EXP"
    />
  ),
};

export const RunFinished: Story = {
  render: () => (
    <GameOverOverlay
      hidden={false}
      title="🏅 IOI 金牌"
      text="总分 372/400，超过分数线 92 分"
      scoreSummary={<p>题目 1: 100 ・ 题目 2: 100 ・ 题目 3: 92 ・ 题目 4: 80</p>}
    />
  ),
};

/**
 * The .win-title / .lose-title / .partial-title rules ship in the stylesheet but
 * the engine never applies them. These stories are the only place they render.
 */
export const RunFinishedWin: Story = {
  render: () => <GameOverOverlay hidden={false} outcome="win" title="🏅 通关" text="全部达线" />,
};

export const RunFinishedPartial: Story = {
  render: () => <GameOverOverlay hidden={false} outcome="partial" title="⚠️ 险过" text="勉强达线" />,
};

export const RunFinishedLose: Story = {
  render: () => <GameOverOverlay hidden={false} outcome="lose" title="💀 出局" text="未达分数线" />,
};

export const Achievements: Story = {
  render: () => (
    <AchievementOverlay hidden={false}>
      <div className="achievement-item">
        <span className="ach-name">一遍过</span>
        <span className="ach-done">已达成</span>
      </div>
      <div className="achievement-item">
        <span className="ach-name">零失误检查</span>
        <span className="ach-none">未达成</span>
      </div>
    </AchievementOverlay>
  ),
};

const BOARD_TABS = ['总榜', 'CSP-S模拟赛', 'CSP-S', 'NOIP模拟赛1', 'NOIP', '省选'];

/** Renders the tab strip the engine normally writes, with `active` on one tab. */
function boardTabs(activeIndex: number) {
  return BOARD_TABS.map((label, i) => (
    <button key={label} className={i === activeIndex ? 'lb-tab active' : 'lb-tab'}>
      {label}
    </button>
  ));
}

/**
 * The 总榜 tab. The engine writes these rows, so the story hand-codes one
 * expanded entry and one collapsed one — that is the only way to see both states
 * at once.
 */
export const Leaderboard: Story = {
  render: () => (
    <LeaderboardOverlay hidden={false} tabs={boardTabs(0)}>
      <div className="lb-head">
        <span className="lb-rank">#</span>
        <span className="lb-name">玩家</span>
        <span className="lb-score">加权总分</span>
        <span className="lb-time">总用时</span>
      </div>
      <details className="lb-entry current" open>
        <summary className="lb-row">
          <span className="lb-rank">1</span>
          <span className="lb-name" style={{ color: '#8E44AD' }}>
            realm
            <span className="leaderboard-level">第14关</span>
          </span>
          <span className="lb-score">13420</span>
          <span className="lb-time">42:07</span>
        </summary>
        <table className="lb-detail">
          <tbody>
            <tr>
              <th>关卡</th>
              <th>比赛</th>
              <th>分数</th>
              <th>用时</th>
              <th>结果</th>
            </tr>
            <tr>
              <td>0</td>
              <td>
                CSP-S模拟赛<span className="lb-sim">模拟</span>
              </td>
              <td>280</td>
              <td>3:12</td>
              <td className="pass">✅</td>
            </tr>
            <tr>
              <td>1</td>
              <td>CSP-S</td>
              <td>310</td>
              <td>4:48</td>
              <td className="pass">✅</td>
            </tr>
            <tr>
              <td>13</td>
              <td>IOI</td>
              <td>412</td>
              <td>8:30</td>
              <td className="fail">❌</td>
            </tr>
          </tbody>
        </table>
      </details>
      <details className="lb-entry">
        <summary className="lb-row">
          <span className="lb-rank">2</span>
          <span className="lb-name" style={{ color: '#5EB95E' }}>
            另一位选手
            <span className="leaderboard-level">第11关</span>
            <span className="leaderboard-easy">简单</span>
          </span>
          <span className="lb-score">3980</span>
          <span className="lb-time">—</span>
        </summary>
        <div className="lb-empty">这局还没有比赛记录</div>
      </details>
    </LeaderboardOverlay>
  ),
};

/** A per-level tab. Rows are flat — a single match has nothing left to expand. */
export const LeaderboardMatchPage: Story = {
  render: () => (
    <LeaderboardOverlay
      hidden={false}
      pageNote="本关的单场排名，取每位玩家在该关的历史最佳一场。"
      tabs={boardTabs(2)}
    >
      <div className="lb-head">
        <span className="lb-rank">#</span>
        <span className="lb-name">玩家</span>
        <span className="lb-score">分数</span>
        <span className="lb-time">用时</span>
        <span className="lb-flag">结果</span>
      </div>
      <div className="lb-entry lb-flat current">
        <div className="lb-row">
          <span className="lb-rank">1</span>
          <span className="lb-name">realm</span>
          <span className="lb-score">400</span>
          <span className="lb-time">4:03</span>
          <span className="lb-flag pass">✅</span>
        </div>
      </div>
      <div className="lb-entry lb-flat">
        <div className="lb-row">
          <span className="lb-rank">2</span>
          <span className="lb-name">另一位选手</span>
          <span className="lb-score">400</span>
          <span className="lb-time">6:28</span>
          <span className="lb-flag pass">✅</span>
        </div>
      </div>
      <div className="lb-entry lb-flat">
        <div className="lb-row">
          <span className="lb-rank">3</span>
          <span className="lb-name">萌新</span>
          <span className="lb-score">120</span>
          <span className="lb-time">—</span>
          <span className="lb-flag fail">❌</span>
        </div>
      </div>
    </LeaderboardOverlay>
  ),
};

export const AchievementsSimpleMode: Story = {
  render: () => (
    <AchievementOverlay hidden={false} mode="simple">
      <div className="achievement-item">
        <span className="ach-name">简单模式通关</span>
        <span className="ach-done">已达成</span>
      </div>
    </AchievementOverlay>
  ),
};
