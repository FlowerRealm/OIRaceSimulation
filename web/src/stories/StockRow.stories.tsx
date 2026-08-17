import type { Meta, StoryObj } from '@storybook/react-vite';
import { StockRow } from '../components/StockRow';

const meta = {
  title: 'Board/StockRow',
  component: StockRow,
  decorators: [
    (Story) => (
      <div className="side-panel" style={{ margin: 20 }}>
        <Story />
      </div>
    ),
  ],
  args: { count: 5, fraction: 0.7 },
} satisfies Meta<typeof StockRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Time: Story = { args: { kind: 'time' } };
export const Mind: Story = { args: { kind: 'mind' } };
export const Boost: Story = { args: { kind: 'boost' } };
export const Inspire: Story = { args: { kind: 'inspire' } };

export const Empty: Story = { args: { kind: 'time', count: 0, fraction: 0 } };
