import type { Meta, StoryObj } from '@storybook/react-vite';
import { AchievementOverlay } from '../components/AchievementOverlay';
import { AuthOverlay } from '../components/AuthOverlay';
import { GameOverOverlay } from '../components/GameOverOverlay';
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
