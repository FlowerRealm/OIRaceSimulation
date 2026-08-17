import type { Meta, StoryObj } from '@storybook/react-vite';
import { GlobalMessage } from '../components/GlobalMessage';
import { inGameContainer } from './decorators';

const meta = {
  title: 'Board/GlobalMessage',
  component: GlobalMessage,
  decorators: [inGameContainer],
} satisfies Meta<typeof GlobalMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { tone: 'info', children: '推理已解锁，可对分叉节点使用' } };

export const Success: Story = { args: { tone: 'success', children: '✅ 正确路径已找到' } };

export const Warning: Story = { args: { tone: 'warning', children: '⚠️ 精力不足，无法继续检查' } };

/** With no tone the banner is invisible; this is its resting state. */
export const Untoned: Story = { args: { children: '没有语气类的消息' } };
