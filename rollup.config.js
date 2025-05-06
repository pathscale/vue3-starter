import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import vue3uiPurge from "@pathscale/rollup-plugin-vue3-ui-css-purge";
import vue3svg from "@pathscale/vue3-svg-icons";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import html, { makeHtmlAttributes } from "@rollup/plugin-html";
import image from "@rollup/plugin-image";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import sucrase from "@rollup/plugin-sucrase";
import terser from "@rollup/plugin-terser";
import vue from "@vitejs/plugin-vue";
import dotenv from "dotenv";
import analyzer from "rollup-plugin-analyzer";
import copy from "rollup-plugin-copy";
import gzip from "rollup-plugin-gzip";
import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";
import { string } from "rollup-plugin-string";
import styles from "rollup-plugin-styles";
import { visualizer } from "rollup-plugin-visualizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensions = [".ts", ".mjs", ".js", ".vue", ".json"];

const env = dotenv.config({ path: path.join(__dirname, ".env") });
const prod = process.env.NODE_ENV === "production";
const watch =
  Boolean(process.env.ROLLUP_WATCH) || Boolean(process.env.LIVERELOAD);

const aliases = {
  "~": path.resolve("src").replace(/\\/g, "/"),
};

const addVersion = (fileName) => {
  const ver = prod ? env.parsed.VUE_APP_VERSION_NUMBER : Date.now();
  const { dir, ext, base } = path.parse(fileName);
  if (ext === ".html") {
    return fileName;
  }
  const filename = `${base}?v=${ver}`;
  return dir ? `${dir}/${filename}` : filename;
};

const template = ({ attributes, files, meta, publicPath, title }) => {
  const scripts = (files.js || [])
    .map(({ fileName }) => {
      const file = addVersion(fileName);
      const attrs = makeHtmlAttributes(attributes.script);
      return `<script src="${publicPath}${file}"${attrs}></script>`;
    })
    .join("\n");

  const links = (files.css || [])
    .map(({ fileName }) => {
      const file = addVersion(fileName);
      const attrs = makeHtmlAttributes(attributes.link);
      return `<link href="${publicPath}${file}" data-href="${publicPath}${file}" rel="stylesheet"${attrs}>`;
    })
    .join("\n");

  const metas = meta
    .map((input) => {
      const attrs = makeHtmlAttributes(input);
      return `<meta${attrs}>`;
    })
    .join("\n");

  return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${metas}
    <title>${title}</title>
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    ${links}
  </head>
  <body>
    <div id="app"></div>
    ${scripts}
  </body>
</html>`;
};

const config = [
  {
    input: "src/main.ts",
    output: [
      {
        format: "iife",
        dir: "dist",
        entryFileNames: `app-${env.parsed.VUE_APP_VERSION_NUMBER}.js`,
        chunkFileNames: `[name]-${env.parsed.VUE_APP_VERSION_NUMBER}.js`,
        assetFileNames: `[name]-${env.parsed.VUE_APP_VERSION_NUMBER}[extname]`,
      },
    ],

    plugins: [
      string({
        include: "**/*.txt",
      }),
      replace({
        values: {
          "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
          "process.env.VUE_APP_VERSION_NUMBER": JSON.stringify(
            env.parsed.VUE_APP_VERSION_NUMBER,
          ),
          "process.env.VUE_APP_USERNAME": JSON.stringify(
            env.parsed.VUE_APP_USERNAME,
          ),
          "process.env.VUE_APP_PASSWORD": JSON.stringify(
            env.parsed.VUE_APP_PASSWORD,
          ),
          "process.env.VUE_APP_EMAIL": JSON.stringify(env.parsed.VUE_APP_EMAIL),
          "process.env.VUE_APP_PHONE_NUMBER": JSON.stringify(
            env.parsed.VUE_APP_PHONE_NUMBER,
          ),
          "process.env.AUTH_SERVER": JSON.stringify(env.parsed.AUTH_SERVER),
          "process.env.APP_SERVER": JSON.stringify(env.parsed.APP_SERVER),
          "process.env.BOT_TOKEN": JSON.stringify(env.parsed.BOT_TOKEN),
          "process.env.WEB_HOOK_SERVER": JSON.stringify(
            env.parsed.WEB_HOOK_SERVER,
          ),
          __VUE_OPTIONS_API__: "false",
          __VUE_PROD_DEVTOOLS__: "false",
          DEBUG: true,
        },
        preventAssignment: true,
      }),
      json(),
      alias({
        entries: [
          { find: "vue", replacement: "@vue/runtime-dom" },
          { find: "~", replacement: path.resolve("src") },
        ],
      }),
      resolve({
        dedupe: [
          "vue",
          "@vue/compiler-core",
          "@vue/compiler-dom",
          "@vue/compiler-sfc",
          "@vue/compiler-ssr",
          "@vue/reactivity",
          "@vue/runtime-core",
          "@vue/runtime-dom",
          "@vue/shared",
          "vuex",
        ],
        preferBuiltins: true,
        extensions,
      }),
      commonjs(),
      vue3svg(),
      // prod && vue3uiPurge({ alias: aliases, debug: false }),
      vue(),
      styles({
        mode: prod ? "extract" : "inject",
        url: {
          hash: "[name][extname]",
          publicPath: env.parsed.BASE_URL,
          inline: true,
        },
        minimize: prod && {
          preset: ["default", { discardComments: { removeAll: true } }],
        },
      }),
      image(),
      sucrase({ exclude: ["**/node_modules/**"], transforms: ["typescript"] }),

      prod && terser({ format: { comments: false } }),
      prod &&
        gzip({
          fileName: ".br",
          customCompression: (content) =>
            zlib.brotliCompressSync(Buffer.from(content), {
              params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
            }),
        }),
      html({
        publicPath: env.parsed.BASE_URL,
        title: "vue3-starter",
        template,
      }),

      watch &&
        serve({
          host: "0.0.0.0",
          contentBase: "dist",
          historyApiFallback: true,
          port: 5000,
        }),

      watch && livereload({ watch: "dist" }),
    ].filter(Boolean),
  },
];

export default config;
