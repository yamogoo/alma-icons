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
  "./react/images",
  "./react/images/*",
  "./vue",
  "./vue/images",
  "./vue/images/*",
  "./manifest",
  "./metadata",
];

for (const exportPath of expectedExports) {
  assert(pkg.exports?.[exportPath], `Missing package export: ${exportPath}`);
}

assert(pkg.sideEffects === false, "package.json must declare sideEffects: false");
assert(metadata.resolveImageKey({ name: "structure" }) === "structure_outline_400", "resolveImageKey default mismatch");
assert(
  metadata.resolveImageKey({ name: "structure", appearance: "outline", weight: "500" }) === "structure_outline_500",
  "resolveImageKey explicit variant mismatch"
);
assert(
  metadata.hasImageVariant({ name: "structure", appearance: "outline", weight: "400" }) === true,
  "hasImageVariant should find structure_outline_400"
);
assert(
  metadata.hasImageVariant({ name: "structure", appearance: "outline", weight: "900" }) === false,
  "hasImageVariant should fail gracefully for missing variants"
);

assert(metadata.imageNames.includes("structure"), "imageNames should include structure");
assert(metadata.imageAppearances.includes("outline") && metadata.imageAppearances.includes("fill"), "imageAppearances mismatch");
assert(metadata.imageWeights.includes("400"), "imageWeights should include 400");
assert(metadata.imageFullNames.includes("structure_outline_400"), "imageFullNames should include structure_outline_400");

const directReactJs = join(root, "dist/react/images/StructureOutline400.js");
const directReactDts = join(root, "dist/react/images/StructureOutline400.d.ts");
const directVueJs = join(root, "dist/vue/images/StructureOutline400.js");
const directVueDts = join(root, "dist/vue/images/StructureOutline400.d.ts");

for (const file of [directReactJs, directReactDts, directVueJs, directVueDts]) {
  assert(existsSync(file), `Missing direct import target: ${file}`);
}

const reactIndex = readFileSync(join(root, "dist/react/images/index.js"), "utf8");
const vueIndex = readFileSync(join(root, "dist/vue/images/index.js"), "utf8");
const reactAlmaImageDts = readFileSync(join(root, "dist/react/index.d.ts"), "utf8");
const vueAlmaImageDts = readFileSync(join(root, "dist/vue/index.d.ts"), "utf8");
const vueAlmaImageJs = readFileSync(join(root, "dist/vue/index.js"), "utf8");
const dts = readFileSync(join(root, "dist/metadata.d.ts"), "utf8");

assert(
  reactIndex.includes('export { default as StructureOutline400 } from "./StructureOutline400.js";'),
  "React named image export missing"
);
assert(
  vueIndex.includes('export { default as StructureOutline400 } from "./StructureOutline400.js";'),
  "Vue named image export missing"
);
assert(reactAlmaImageDts.includes("appearance?: AlmaImageAppearance;"), "React AlmaImage appearance prop missing");
assert(vueAlmaImageDts.includes("appearance?: AlmaImageAppearance;"), "Vue AlmaImage appearance prop missing");
assert(!reactAlmaImageDts.includes("style?: AlmaImageAppearance;"), "React AlmaImage should not expose style as image appearance");
assert(!vueAlmaImageDts.includes("style?: AlmaImageAppearance;"), "Vue AlmaImage should not expose style as image appearance");
assert(vueAlmaImageJs.includes("appearance: { type: String"), "Vue AlmaImage runtime appearance prop missing");
assert(dts.includes('export type AlmaImageName ='), "AlmaImageName union missing");
assert(dts.includes('"structure"'), "AlmaImageName union should include structure");
assert(dts.includes('export type AlmaImageAppearance = "outline" | "fill";'), "AlmaImageAppearance union mismatch");
assert(
  dts.includes('export type AlmaImageWeight = "100" | "200" | "300" | "400" | "500";'),
  "AlmaImageWeight union mismatch"
);
assert(
  dts.includes("export type AlmaImageFullName = `${AlmaImageName}_${AlmaImageAppearance}_${AlmaImageWeight}`;"),
  "AlmaImageFullName template type missing"
);

console.log("Generated Alma Images validation passed.");
