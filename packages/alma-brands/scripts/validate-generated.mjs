import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const pkg = readJson(join(root, "package.json"));
const metadata = await import(
  pathToFileURL(join(root, "dist/metadata.js")).href
);

const expectedExports = [
  ".",
  "./react",
  "./react/icons",
  "./react/icons/*",
  "./vue",
  "./vue/icons",
  "./vue/icons/*",
  "./manifest",
  "./metadata",
];

for (const exportPath of expectedExports) {
  assert(pkg.exports?.[exportPath], `Missing package export: ${exportPath}`);
}

assert(
  pkg.sideEffects === false,
  "package.json must declare sideEffects: false",
);

assert(
  metadata.resolveBrandKey({ name: "figma" }) === "figma_mark_default",
  "resolveBrandKey default mismatch",
);

assert(
  metadata.resolveBrandKey({
    name: "figma",
    variant: "mark",
    appearance: "monochrome",
  }) === "figma_mark_monochrome",
  "resolveBrandKey explicit variant mismatch",
);

assert(
  metadata.hasBrandVariant({
    name: "figma",
    variant: "mark",
    appearance: "default",
  }) === true,
  "hasBrandVariant should find figma_mark_default",
);

assert(
  metadata.hasBrandVariant({
    name: "figma",
    variant: "standard",
    appearance: "unknown",
  }) === false,
  "hasBrandVariant should fail gracefully for missing variants",
);

assert(
  metadata.brandNames.includes("figma"),
  "brandNames should include figma",
);

assert(
  metadata.brandVariants.includes("mark"),
  "brandVariants should include mark",
);

assert(
  metadata.brandAppearances.includes("default"),
  "brandAppearances should include default",
);

assert(
  metadata.brandAppearances.includes("monochrome"),
  "brandAppearances should include monochrome",
);

assert(
  metadata.brandFullNames.includes("figma_mark_default"),
  "brandFullNames should include figma_mark_default",
);

const directReactJs = join(root, "dist/react/icons/FigmaMarkDefault.js");

const directReactDts = join(root, "dist/react/icons/FigmaMarkDefault.d.ts");

const directVueJs = join(root, "dist/vue/icons/FigmaMarkDefault.js");

const directVueDts = join(root, "dist/vue/icons/FigmaMarkDefault.d.ts");

for (const file of [directReactJs, directReactDts, directVueJs, directVueDts]) {
  assert(existsSync(file), `Missing direct import target: ${file}`);
}

const reactIndex = readFileSync(
  join(root, "dist/react/icons/index.js"),
  "utf8",
);

const vueIndex = readFileSync(join(root, "dist/vue/icons/index.js"), "utf8");

const reactAlmaBrandDts = readFileSync(
  join(root, "dist/react/index.d.ts"),
  "utf8",
);

const vueAlmaBrandDts = readFileSync(join(root, "dist/vue/index.d.ts"), "utf8");

const vueAlmaBrandJs = readFileSync(join(root, "dist/vue/index.js"), "utf8");

const dts = readFileSync(join(root, "dist/metadata.d.ts"), "utf8");

assert(
  reactIndex.includes(
    'export { default as FigmaMarkDefault } from "./FigmaMarkDefault.js";',
  ),
  "React named brand export missing",
);

assert(
  vueIndex.includes(
    'export { default as FigmaMarkDefault } from "./FigmaMarkDefault.js";',
  ),
  "Vue named brand export missing",
);

assert(
  reactAlmaBrandDts.includes("variant?: AlmaBrandVariant;"),
  "React AlmaBrand variant prop missing",
);

assert(
  reactAlmaBrandDts.includes("appearance?: AlmaBrandAppearance;"),
  "React AlmaBrand appearance prop missing",
);

assert(
  vueAlmaBrandDts.includes("variant?: AlmaBrandVariant;"),
  "Vue AlmaBrand variant prop missing",
);

assert(
  vueAlmaBrandDts.includes("appearance?: AlmaBrandAppearance;"),
  "Vue AlmaBrand appearance prop missing",
);

assert(
  !reactAlmaBrandDts.includes("title?: string;"),
  "React AlmaBrand should not expose title prop",
);

assert(
  !vueAlmaBrandDts.includes("title?: string;"),
  "Vue AlmaBrand should not expose title prop",
);

assert(
  !readFileSync(directReactDts, "utf8").includes("title?: string;"),
  "Direct React brand component should not expose title prop",
);

assert(
  !readFileSync(directVueDts, "utf8").includes("title?: string;"),
  "Direct Vue brand component should not expose title prop",
);

assert(
  vueAlmaBrandJs.includes('variant: { type: String, default: "mark" }'),
  "Vue AlmaBrand runtime variant prop missing",
);

assert(
  vueAlmaBrandJs.includes('appearance: { type: String, default: "default" }'),
  "Vue AlmaBrand runtime appearance prop missing",
);

assert(
  !vueAlmaBrandJs.includes("title: { type: String"),
  "Vue AlmaBrand runtime should not expose title prop",
);

assert(
  dts.includes("export type AlmaBrandName ="),
  "AlmaBrandName union missing",
);

assert(dts.includes('"figma"'), "AlmaBrandName union should include figma");

assert(
  dts.includes("export type AlmaBrandVariant ="),
  "AlmaBrandVariant union missing",
);

assert(dts.includes('"mark"'), "AlmaBrandVariant union should include mark");

assert(
  dts.includes("export type AlmaBrandAppearance ="),
  "AlmaBrandAppearance union missing",
);

assert(
  dts.includes('"default"'),
  "AlmaBrandAppearance union should include default",
);

assert(
  dts.includes('"monochrome"'),
  "AlmaBrandAppearance union should include monochrome",
);

assert(
  dts.includes(
    "export type AlmaBrandFullName = `${AlmaBrandName}_${AlmaBrandVariant}_${AlmaBrandAppearance}`;",
  ),
  "AlmaBrandFullName template type missing",
);

console.log("Generated Alma Brands validation passed.");
