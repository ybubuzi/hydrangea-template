import { resolve } from 'path';
import type { UserConfig } from 'electron-vite';

export function useAliasPath(config: UserConfig) {
  const pwd = process.cwd();
  const option = {
    '@': resolve(pwd, 'src'),
    '$': resolve(pwd),
  };
  config.main!.resolve ??= {}
  config.main!.resolve!.alias = option;
  config.preload!.resolve ??= {}
  config.preload!.resolve!.alias = option;
  config.renderer!.resolve ??= {}
  config.renderer!.resolve!.alias = option;
  return config;
}
