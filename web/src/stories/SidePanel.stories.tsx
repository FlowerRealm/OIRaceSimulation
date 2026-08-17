import type { Meta, StoryObj } from '@storybook/react-vite';
import { SidePanel } from '../components/SidePanel';
import { inSidebar } from './decorators';

const meta = {
  title: 'Board/SidePanel',
  component: SidePanel,
  decorators: [inSidebar],
} satisfies Meta<typeof SidePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** How the panel looks before anything has been bought. */
export const FreshRun: Story = {};

export const WithStock: Story = {
  args: {
    mind: 9,
    focusStacks: 2,
    focusStatusText: '可用',
    focusButtonHidden: false,
    stocks: { time: 4, mind: 2, boost: 7, inspire: 1 },
  },
};

export const LateGame: Story = {
  args: {
    mind: 21,
    focusStacks: 5,
    focusStatusText: '已聚焦',
    focusButtonHidden: false,
    stocks: { time: 12, mind: 11, boost: 9, inspire: 6 },
    achievements: (
      <>
        <div>🏅 一遍过</div>
        <div>🏅 零失误检查</div>
      </>
    ),
  },
};
