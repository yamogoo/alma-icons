import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const pkg = readJson(join(root, "package.json"));
const metadata = await import(pathToFileURL(join(root, "dist/metadata.js")).href);

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

assert(pkg.sideEffects === false, "package.json must declare sideEffects: false");
assert(metadata.resolveIconKey({ name: "search" }) === "search_outline_400", "resolveIconKey default mismatch");
assert(
  metadata.resolveIconKey({ name: "search", style: "fill", weight: "500" }) === "search_fill_500",
  "resolveIconKey explicit variant mismatch"
);
assert(
  metadata.hasIconVariant({ name: "search", style: "outline", weight: "400" }) === true,
  "hasIconVariant should find search_outline_400"
);
assert(
  metadata.hasIconVariant({ name: "search", style: "outline", weight: "900" }) === false,
  "hasIconVariant should fail gracefully for missing variants"
);

assert(metadata.iconNames.includes("search"), "iconNames should include search");
assert(metadata.iconStyles.includes("outline") && metadata.iconStyles.includes("fill"), "iconStyles mismatch");
assert(metadata.iconWeights.includes("400"), "iconWeights should include 400");
assert(metadata.iconFullNames.includes("search_outline_400"), "iconFullNames should include search_outline_400");

const directReactJs = join(root, "dist/react/icons/SearchOutline400.js");
const directReactDts = join(root, "dist/react/icons/SearchOutline400.d.ts");
const directVueJs = join(root, "dist/vue/icons/SearchOutline400.js");
const directVueDts = join(root, "dist/vue/icons/SearchOutline400.d.ts");

for (const file of [directReactJs, directReactDts, directVueJs, directVueDts]) {
  assert(existsSync(file), `Missing direct import target: ${file}`);
}

const reactIndex = readFileSync(join(root, "dist/react/icons/index.js"), "utf8");
const vueIndex = readFileSync(join(root, "dist/vue/icons/index.js"), "utf8");
const reactAlmaIconDts = readFileSync(join(root, "dist/react/index.d.ts"), "utf8");
const vueAlmaIconDts = readFileSync(join(root, "dist/vue/index.d.ts"), "utf8");
const vueAlmaIconJs = readFileSync(join(root, "dist/vue/index.js"), "utf8");
const dts = readFileSync(join(root, "dist/metadata.d.ts"), "utf8");

assert(
  reactIndex.includes('export { default as SearchOutline400 } from "./SearchOutline400.js";'),
  "React named icon export missing"
);
assert(
  vueIndex.includes('export { default as SearchOutline400 } from "./SearchOutline400.js";'),
  "Vue named icon export missing"
);
assert(reactAlmaIconDts.includes("appearance?: AlmaIconStyle;"), "React AlmaIcon appearance prop missing");
assert(vueAlmaIconDts.includes("appearance?: AlmaIconStyle;"), "Vue AlmaIcon appearance prop missing");
assert(!reactAlmaIconDts.includes("style?: AlmaIconStyle;"), "React AlmaIcon should not expose style as icon appearance");
assert(!vueAlmaIconDts.includes("style?: AlmaIconStyle;"), "Vue AlmaIcon should not expose style as icon appearance");
assert(vueAlmaIconJs.includes("appearance: { type: String"), "Vue AlmaIcon runtime appearance prop missing");
assert(dts.includes('export type AlmaIconName ='), "AlmaIconName union missing");
assert(dts.includes('"search"'), "AlmaIconName union should include search");
assert(dts.includes('export type AlmaIconStyle = "outline" | "fill";'), "AlmaIconStyle union mismatch");
assert(
  dts.includes('export type AlmaIconWeight = "100" | "200" | "300" | "400" | "500";'),
  "AlmaIconWeight union mismatch"
);
assert(
  dts.includes("export type AlmaIconFullName = `${AlmaIconName}_${AlmaIconStyle}_${AlmaIconWeight}`;"),
  "AlmaIconFullName template type missing"
);

console.log("Generated Alma Icons validation passed.");
