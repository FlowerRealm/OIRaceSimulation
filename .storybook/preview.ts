import type { Preview } from '@storybook/react-vite';
// Every story needs the real stylesheet: these components carry no styles of
// their own, all of it lives in the shared cascade.
import '../web/src/styles/index.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i } },
    // The game's own background is part of the design, not a Storybook default.
    backgrounds: { disable: true },
  },
};

export default preview;
