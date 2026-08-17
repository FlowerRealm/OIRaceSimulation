import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../web/src/**/*.stories.@(ts|tsx)'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Storybook renders components in isolation, so it must not inherit the app's
  // vite root (web/) — it resolves stories from the repo root instead.
  viteFinal: async (viteConfig) => {
    viteConfig.root = process.cwd();
    return viteConfig;
  },
};

export default config;
