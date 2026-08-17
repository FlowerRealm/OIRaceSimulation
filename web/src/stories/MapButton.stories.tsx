import type { Meta, StoryObj } from '@storybook/react-vite';
import { MapButton } from '../components/MapButton';

const meta = {
  title: 'Board/MapButton',
  component: MapButton,
  decorators: [
    (Story) => (
      <div className="map-selector" style={{ padding: 20 }}>
        <Story />
      </div>
    ),
  ],
  args: { label: '题目 2' },
} satisfies Meta<typeof MapButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {};
export const Active: Story = { args: { state: 'active' } };
export const Win: Story = { args: { state: 'win' } };
export const Lose: Story = { args: { state: 'lose' } };

/** Marks a problem whose correct path is known but not yet submitted. */
export const CorrectFound: Story = { args: { correctFound: true } };

export const AllStates: Story = {
  render: () => (
    <>
      <MapButton label="题目 1" state="win" />
      <MapButton label="题目 2" state="active" correctFound />
      <MapButton label="题目 3" state="lose" />
      <MapButton label="题目 4" />
    </>
  ),
};
