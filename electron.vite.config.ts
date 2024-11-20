import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import { useAutoImport } from './config/vite-config/auto-import';
import { useAliasPath } from './config/vite-config/alias';
import type { UserConfig } from 'electron-vite';

export default defineConfig((_cfg) => {
  const config: UserConfig = {
    main: {
      plugins: [
        externalizeDepsPlugin({
          exclude: ['nanoid']
        })
      ]
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [vue()]
    }
  };
  useAutoImport(config);
  useAliasPath(config);
  return config;
});
