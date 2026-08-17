import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoBar } from '../components/InfoBar';
import { inGameContainer } from './decorators';

const meta = {
  title: 'Board/InfoBar',
  component: InfoBar,
  decorators: [inGameContainer],
} satisfies Meta<typeof InfoBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The legend is the only key to what the node colours on the canvas mean. */
export const FreshRun: Story = {};

export const MidRun: Story = {
  args: { mapIndex: 3, totalMaps: 4, unlockedCount: 11, maxScore: 275 },
};

export const CorrectPathFound: Story = {
  args: { mapIndex: 2, unlockedCount: 6, maxScore: 180, correctFound: true },
};
