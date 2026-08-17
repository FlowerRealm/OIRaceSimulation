import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActiveSkillsBar, ActiveSkillTag } from '../components/ActiveSkillsBar';
import { inGameContainer } from './decorators';

const meta = {
  title: 'Board/ActiveSkillsBar',
  component: ActiveSkillsBar,
  decorators: [inGameContainer],
} satisfies Meta<typeof ActiveSkillsBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Owned: Story = {
  args: {
    children: (
      <>
        <ActiveSkillTag>👁️ 聚焦</ActiveSkillTag>
        <ActiveSkillTag>🔍 推理</ActiveSkillTag>
        <ActiveSkillTag>⏳ 时间大师</ActiveSkillTag>
        <ActiveSkillTag>💰 钞能力</ActiveSkillTag>
      </>
    ),
  },
};
