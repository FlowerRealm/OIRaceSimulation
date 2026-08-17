import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScoreBar } from '../components/ScoreBar';
import { inGameContainer } from './decorators';

const meta = {
  title: 'Board/ScoreBar',
  component: ScoreBar,
  decorators: [inGameContainer],
  args: { score: 0, total: 400 },
} satisfies Meta<typeof ScoreBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Partial: Story = { args: { score: 175 } };

export const Full: Story = { args: { score: 400 } };

/** The engine flashes this class for 150ms whenever the score moves. */
export const Ticking: Story = { args: { score: 240, ticking: true } };
