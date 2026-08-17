import type { Meta, StoryObj } from '@storybook/react-vite';
import { ShopOverlay } from '../components/ShopOverlay';
import { onGameBackground } from './decorators';

const meta = {
  title: 'Overlays/ShopOverlay',
  component: ShopOverlay,
  decorators: [onGameBackground],
  parameters: { layout: 'fullscreen' },
  args: { hidden: false },
} satisfies Meta<typeof ShopOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

const previewRow = (label: string, value: string) => (
  <div className="shop-preview-row" key={label}>
    <span className="shop-preview-label">{label}</span>
    <span className="shop-preview-value">{value}</span>
  </div>
);

export const Empty: Story = {};

export const Stocked: Story = {
  args: {
    skillPoints: 14,
    spEarned: '+6 sp',
    left: (
      <>
        <div className="stock-section">
          <div className="stock-section-title">📦 升级存量</div>
          <div className="stock-item">
            <span className="stock-item-name">⏰ 时间</span>
            <span className="stock-item-count">×3</span>
            <span className="stock-item-cost">下一关 +2.5 时间</span>
            <button className="btn-stock-buy">4sp购买</button>
          </div>
          <div className="stock-item">
            <span className="stock-item-name">🧠 思维</span>
            <span className="stock-item-count">×1</span>
            <span className="stock-item-cost">思维 +1</span>
            <button className="btn-stock-buy" disabled>
              9sp购买
            </button>
          </div>
        </div>
      </>
    ),
    nextMatch: [
      previewRow('比赛名称', 'NOI'),
      previewRow('初始时间', '32'),
      previewRow('精力上限', '38'),
      previewRow('题目数', '3'),
      previewRow('分数线', '210'),
    ],
    personal: [
      previewRow('🧠 思维', '11'),
      previewRow('💎 特殊节点奖励', '2.5 sp/个'),
      previewRow('⚡ 振奋效果乘数', '×2'),
      previewRow('💠 提升等级', 'Lv.2'),
      previewRow('💰 钞能力', '可用'),
    ],
    leaderboard: (
      <>
        <div className="leaderboard-item">
          <span className="leaderboard-rank">1</span>
          <span className="leaderboard-name">realm</span>
          <span className="leaderboard-score">372</span>
        </div>
        <div className="leaderboard-item">
          <span className="leaderboard-rank">2</span>
          <span className="leaderboard-name">另一位选手</span>
          <span className="leaderboard-score">310</span>
        </div>
      </>
    ),
    tips: <div className="tip-item">💡 检查分叉节点前先聚焦，命中率更高</div>,
  },
};
