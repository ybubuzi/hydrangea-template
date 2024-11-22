// electron.vite.config.ts
import { resolve as resolve2 } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";

// config/vite-config/auto-import.ts
import AutoImport from "unplugin-auto-import/vite";
import path from "path";
var sharedImportConf = [{}];
var mainImportConf = [...sharedImportConf];
var rendererImportConf = [...sharedImportConf];
function GetDTSPath(label) {
  return path.resolve(process.cwd(), "build-dev", `auto-${label}-import.d.ts`);
}
function useAutoImport(config) {
  for (const k of ["main", "renderer"]) {
    config[k].plugins = config[k].plugins ?? [];
  }
  config.main?.plugins?.push(
    AutoImport({
      imports: mainImportConf,
      dts: GetDTSPath("main"),
      dirs: ["src/shared/common"]
    })
  );
  config.renderer?.plugins?.push(
    AutoImport({
      imports: rendererImportConf,
      dts: GetDTSPath("renderer"),
      dirs: ["src/shared/common"]
    })
  );
  console.log(config);
  return config;
}

// config/vite-config/alias.ts
import { resolve } from "path";
function useAliasPath(config) {
  const pwd = process.cwd();
  const option = {
    "@": resolve(pwd, "src"),
    "$": resolve(pwd)
  };
  config.main.resolve ??= {};
  config.main.resolve.alias = option;
  config.preload.resolve ??= {};
  config.preload.resolve.alias = option;
  config.renderer.resolve ??= {};
  config.renderer.resolve.alias = option;
  return config;
}

// electron.vite.config.ts
var electron_vite_config_default = defineConfig((_cfg) => {
  const config = {
    main: {
      plugins: [
        externalizeDepsPlugin({
          exclude: ["nanoid"]
        })
      ]
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          "@renderer": resolve2("src/renderer/src")
        }
      },
      plugins: [vue()]
    }
  };
  useAutoImport(config);
  useAliasPath(config);
  return config;
});
export {
  electron_vite_config_default as default
};
