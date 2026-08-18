import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChallengeItem } from '../components/ChallengeItem';

const meta = {
  title: 'Challenges/ChallengeItem',
  component: ChallengeItem,
  decorators: [
    (Story) => (
      <div className="challenge-list" style={{ maxWidth: 460, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
  args: { name: 'I级：时间不足', desc: '每在一道题获得100分 -k 时间' },
} satisfies Meta<typeof ChallengeItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = { args: { tier: 1 } };

export const Tier1On: Story = { args: { tier: 1, on: true } };

export const Tier2On: Story = {
  args: { tier: 2, on: true, name: 'V级：名额紧张', desc: '每场比赛分数线 +30' },
};

export const Tier3On: Story = {
  args: { tier: 3, on: true, name: 'IX级：低悟性', desc: '技能点×0.75' },
};

/** While the tier's EXP challenge is on, the individual ones are struck through. */
export const OverriddenByExp: Story = {
  args: { tier: 1, on: true, expOverride: true },
};

export const ExpLocked: Story = {
  args: {
    kind: 'exp',
    name: '⚡I EXP：落后资源',
    desc: '时间结构仅+1.5时间',
    expTip: '💡 EXP 挑战需要开启所有同级挑战后解锁',
  },
};

export const ExpUnlocked: Story = {
  args: { ...ExpLocked.args, canActivate: true },
};

export const ExpActive: Story = {
  args: { ...ExpLocked.args, canActivate: true, on: true },
};

/** The ⓘ affordance opens a rules popup in the app. */
export const ExpWithTip: Story = {
  args: {
    kind: 'exp',
    name: '⚡II EXP：骗分困难',
    desc: 'k改为15',
    canActivate: true,
    on: true,
    tipId: 'tipIIexp',
  },
};

export const FunOff: Story = {
  args: { kind: 'fun', name: 'Fun I：AC的骄傲', desc: '无法正常获得技能点，AC得6sp' },
};

export const FunOn: Story = { args: { ...FunOff.args, on: true } };

export const AssistOff: Story = {
  args: { kind: 'assist', name: '辅助挑战 I', desc: '推理和聚焦不再需要技能点购买' },
};

export const AssistOn: Story = { args: { ...AssistOff.args, on: true } };
