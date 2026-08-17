import type { Meta, StoryObj } from '@storybook/react-vite';
import { FocusButton } from '../components/FocusButton';

const meta = {
  title: 'Board/FocusButton',
  component: FocusButton,
  decorators: [
    (Story) => (
      <div className="side-panel" style={{ margin: 20 }}>
        <div className="side-attr-row">
          <span className="side-attr-label">👁️凝聚</span>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof FocusButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {};

export const Active: Story = { args: { active: true } };

/** Not yet bought in the shop. */
export const Locked: Story = { args: { locked: true } };

/** The stamina price rides along as a ::after badge. */
export const WithCost: Story = { args: { cost: '2' } };
