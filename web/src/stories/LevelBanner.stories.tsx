import type { Meta, StoryObj } from '@storybook/react-vite';
import { LevelBanner } from '../components/LevelBanner';
import { inGameContainer } from './decorators';

const meta = {
  title: 'Board/LevelBanner',
  component: LevelBanner,
  decorators: [inGameContainer],
  args: { levelName: 'NOIP 提高组', stamina: 20 },
} satisfies Meta<typeof LevelBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};

export const SimpleMode: Story = {
  args: { variant: 'sim', levelName: 'CSP-S 第一轮' },
};

/** The final contest glows; the animation runs continuously. */
export const Final: Story = {
  args: { variant: 'final', levelName: 'IOI', stamina: 60 },
};
