import type { Decorator } from '@storybook/react-vite';

/**
 * Most panels are `width: 100%` children of `.game-container` and collapse to
 * nothing on their own, so stories render them inside a real container rather
 * than bare. `.main-wrapper` supplies the flex context the container expects.
 */
export const inGameContainer: Decorator = (Story) => (
  <div className="main-wrapper" style={{ padding: 20 }}>
    <div className="game-container">
      <Story />
    </div>
  </div>
);

/** The side panel is a sibling of the game container, not a child of it. */
export const inSidebar: Decorator = (Story) => (
  <div className="main-wrapper" style={{ padding: 20 }}>
    <Story />
  </div>
);

/**
 * Overlays are `position: fixed` and paint their own scrim, so they need the
 * full viewport and a page behind them to sit on.
 */
export const onGameBackground: Decorator = (Story) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
    <Story />
  </div>
);
