import autoImportFn from 'unplugin-auto-import/vite';
import AutoImport from 'unplugin-auto-import/vite';
import path from 'path'
import type { UserConfig } from 'electron-vite';

type Options = Exclude<Parameters<typeof autoImportFn>[0], null | undefined>;
type ImportsType = Options['imports'];

/** 共享全局导入 */
const sharedImportConf: ImportsType = [{

}];
/** 主进程内自动导入 */
const mainImportConf: ImportsType = [...sharedImportConf];
/** 渲染进程内自动导入 */
const rendererImportConf: ImportsType = [...sharedImportConf];

export function GetDTSPath(label:string){
  return path.resolve(process.cwd(),'build-dev',`auto-${label}-import.d.ts`)
}

export function useAutoImport(config: UserConfig) {
  for (const k of ['main', 'renderer']) {
    config[k].plugins = config[k].plugins ?? [];
  }
  
  config.main?.plugins?.push(
    AutoImport({
      imports: mainImportConf,
      dts: GetDTSPath('main'),
      dirs: ['src/shared/common']
    }),
  );
  config.renderer?.plugins?.push(
    AutoImport({
      imports: rendererImportConf,
      dts: GetDTSPath('renderer'),
      dirs: ['src/shared/common']
    }),
  );
  console.log(config)
  return config
}
