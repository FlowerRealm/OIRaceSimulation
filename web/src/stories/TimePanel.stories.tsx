import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePanel } from '../components/TimePanel';
import { inGameContainer } from './decorators';

const meta = {
  title: 'Board/TimePanel',
  component: TimePanel,
  decorators: [inGameContainer],
  args: { time: 20, timeFraction: 1, staminaFraction: 1, staminaRef: 24 },
} satisfies Meta<typeof TimePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const Spent: Story = {
  args: { time: 7, timeFraction: 0.35, staminaFraction: 0.6 },
};

/** Darkens the bar and the number once time is nearly gone. */
export const Danger: Story = {
  args: { time: 2, timeFraction: 0.1, staminaFraction: 0.3, danger: true },
};

export const Ticking: Story = {
  args: { time: 12, timeFraction: 0.6, staminaFraction: 0.75, ticking: true },
};
