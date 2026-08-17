import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChallengeOverlay } from '../components/ChallengeOverlay';
import type { ChallengeState } from '../components/ChallengeGroup';
import { onGameBackground } from './decorators';

const meta = {
  title: 'Challenges/ChallengeOverlay',
  component: ChallengeOverlay,
  decorators: [onGameBackground],
  parameters: { layout: 'fullscreen' },
  args: { hidden: false },
} satisfies Meta<typeof ChallengeOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = { args: { hidden: true } };

export const NothingEnabled: Story = {};

/** Every tier-1 challenge on, so its EXP entry has unlocked. */
export const Tier1Complete: Story = {
  args: { state: { I: true, II: true, III: true } },
};

/** With the EXP challenge on, the tier's individual entries are struck through. */
export const Tier1ExpActive: Story = {
  args: { state: { I: true, II: true, III: true, I_exp: true } },
};

export const Cleared: Story = {
  args: { ioiCleared: true, state: { IV: true, V: true, fun_I: true, assist_I: true } },
};

/** Click the rows: the whole unlock cascade runs off the same state object. */
export const Interactive: Story = {
  render: (args) => {
    const [state, setState] = useState<ChallengeState>({});
    return (
      <ChallengeOverlay
        {...args}
        state={state}
        onToggle={(key) => setState((prev) => ({ ...prev, [key]: !prev[key] }))}
      />
    );
  },
};
