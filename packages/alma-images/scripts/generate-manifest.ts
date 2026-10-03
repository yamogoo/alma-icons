import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, extname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const root = resolve(__dirname, "..");
const imagesDir = join(root, "images");
const distDir = join(root, "dist");
const reactDir = join(distDir, "react");
const reactImagesDir = join(reactDir, "images");
const vueDir = join(distDir, "vue");
const vueImagesDir = join(vueDir, "images");

const supportedAppearances = ["outline", "fill"] as const;
const supportedWeights = ["100", "200", "300", "400", "500"] as const;

type SupportedAppearance = (typeof supportedAppearances)[number];
type SupportedWeight = (typeof supportedWeights)[number];

type ImageFile = {
  key: string;
  name: string;
  appearance: string;
  weight: string;
  fullPath: string;
  sourceRel: string;
  componentName: string;
  isAlmaVariant: boolean;
};

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function cleanDir(dir: string) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  ensureDir(dir);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireGenerationLock() {
  const lockDir = join(root, ".generate-lock");
  const timeoutMs = 120_000;
  const staleAfterMs = 120_000;
  const startedAt = Date.now();
  let released = false;

  while (true) {
    try {
      mkdirSync(lockDir);

      return () => {
        if (!released) {
          released = true;
          rmSync(lockDir, { recursive: true, force: true });
        }
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;

      if (code !== "EEXIST") {
        throw error;
      }

      let stats;

      try {
        stats = statSync(lockDir);
      } catch (statError) {
        if ((statError as NodeJS.ErrnoException).code === "ENOENT") {
          continue;
        }

        throw statError;
      }

      if (Date.now() - stats.mtimeMs > staleAfterMs) {
        rmSync(lockDir, { recursive: true, force: true });
        continue;
      }

      if (Date.now() - startedAt > timeoutMs) {
        throw new Error(`Timed out waiting for Alma Images generation lock: ${lockDir}`);
      }

      await sleep(100);
    }
  }
}

function walk(dir: string): string[] {
  const entries = readdirSync(dir).sort((a, b) => a.localeCompare(b));
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (stats.isFile() && extname(entry) === ".svg") {
      files.push(fullPath);
    }
  }

  return files;
}

function parseFileName(filePath: string) {
  const base = filePath.split(/[\\/]/).pop()!;
  const key = base.replace(/\.svg$/, "");
  const parts = key.split("_");

  if (parts.length !== 3) {
    throw new Error(`Unexpected image name format: ${base}`);
  }

  const [name, appearance, weight] = parts;
  return { key, name, appearance, weight };
}

function isSupportedAppearance(appearance: string): appearance is SupportedAppearance {
  return (supportedAppearances as readonly string[]).includes(appearance);
}

function isSupportedWeight(weight: string): weight is SupportedWeight {
  return (supportedWeights as readonly string[]).includes(weight);
}

function toPascalCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+|\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function toComponentName({ name, appearance, weight }: Pick<ImageFile, "name" | "appearance" | "weight">) {
  const componentName = `${toPascalCase(name)}${toPascalCase(appearance)}${toPascalCase(weight)}`;

  if (!/^[A-Za-z]/.test(componentName)) {
    return `Image${componentName}`;
  }

  return componentName;
}

function quote(value: string) {
  return JSON.stringify(value);
}

function union(values: string[]) {
  if (values.length === 0) {
    return "never";
  }

  return values.map((value) => `  | ${quote(value)}`).join("\n");
}

function writeGenerated(filePath: string, content: string) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, `${content.trimEnd()}\n`, "utf8");
}

function extractSvg(svg: string, filePath: string) {
  const match = svg.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>\s*$/i);

  if (!match) {
    throw new Error(`Unable to parse SVG: ${filePath}`);
  }

  const attrs = Object.fromEntries(
    [...match[1].matchAll(/([:\w-]+)\s*=\s*"([^"]*)"/g)].map((attr) => [
      attr[1],
      attr[2],
    ])
  );

  const currentColorInner = match[2]
    .trim()
    .replace(/\bfill="black"/g, 'fill="currentColor"')
    .replace(/\bstroke="black"/g, 'stroke="currentColor"');

  return {
    viewBox: attrs.viewBox ?? "0 0 24 24",
    fill: attrs.fill,
    xmlns: attrs.xmlns ?? "http://www.w3.org/2000/svg",
    inner: currentColorInner,
  };
}

function renderManifest(entries: ImageFile[], importPrefix: string) {
  return entries
    .map(({ key, sourceRel }) => `  ${quote(key)}: () => import(${quote(`${importPrefix}${sourceRel}`)})`)
    .join(",\n");
}

function renderComponentManifest(entries: ImageFile[]) {
  return entries
    .map(({ key, componentName }) => `  ${quote(key)}: () => import(${quote(`./images/${componentName}.js`)})`)
    .join(",\n");
}

function renderMetadataDts(validEntries: ImageFile[], legacyEntries: ImageFile[]) {
  const names = [...new Set(validEntries.map(({ name }) => name))].sort((a, b) => a.localeCompare(b));
  const fullNames = validEntries.map(({ key }) => key);
  const legacyFullNames = legacyEntries.map(({ key }) => key);

  return `// AUTO-GENERATED by AlmaImagesResolver

export type AlmaImageName =
${union(names)};

export type AlmaImageAppearance = "outline" | "fill";
export type AlmaImageWeight = "100" | "200" | "300" | "400" | "500";
export type AlmaImageFullName = \`\${AlmaImageName}_\${AlmaImageAppearance}_\${AlmaImageWeight}\`;

export type AlmaLegacyImageFullName =
${union(legacyFullNames)};

export type ImageName = AlmaImageName;
export type ImageAppearance = AlmaImageAppearance;
export type ImageWeight = AlmaImageWeight;
export type ImageFullName = AlmaImageFullName | AlmaLegacyImageFullName;

export type ResolveImageKeyOptions = {
  name: AlmaImageName;
  appearance?: AlmaImageAppearance;
  weight?: AlmaImageWeight;
};

export type ImageVariantOptions = {
  name: AlmaImageName;
  appearance: AlmaImageAppearance;
  weight: AlmaImageWeight;
};

export declare const imageNames: readonly AlmaImageName[];
export declare const imageAppearances: readonly AlmaImageAppearance[];
export declare const imageWeights: readonly AlmaImageWeight[];
export declare const imageFullNames: readonly AlmaImageFullName[];
export declare const legacyImageFullNames: readonly AlmaLegacyImageFullName[];
export declare function resolveImageKey(options: ResolveImageKeyOptions): AlmaImageFullName;
export declare function hasImageVariant(options: ImageVariantOptions): boolean;
`;
}

function renderMetadataJs(validEntries: ImageFile[], legacyEntries: ImageFile[]) {
  const names = [...new Set(validEntries.map(({ name }) => name))].sort((a, b) => a.localeCompare(b));
  const fullNames = validEntries.map(({ key }) => key);
  const legacyFullNames = legacyEntries.map(({ key }) => key);

  return `// AUTO-GENERATED by AlmaImagesResolver

export const imageNames = ${JSON.stringify(names, null, 2)};
export const imageAppearances = ${JSON.stringify(supportedAppearances, null, 2)};
export const imageWeights = ${JSON.stringify(supportedWeights, null, 2)};
export const imageFullNames = ${JSON.stringify(fullNames, null, 2)};
export const legacyImageFullNames = ${JSON.stringify(legacyFullNames, null, 2)};

const imageFullNameSet = new Set(imageFullNames);

export function resolveImageKey({ name, appearance = "outline", weight = "400" }) {
  return \`\${name}_\${appearance}_\${weight}\`;
}

export function hasImageVariant({ name, appearance, weight }) {
  return imageFullNameSet.has(resolveImageKey({ name, appearance, weight }));
}
`;
}

function renderManifestDts() {
  return `// AUTO-GENERATED by AlmaImagesResolver

import type { AlmaImageFullName, AlmaLegacyImageFullName, ImageFullName } from "./metadata.js";

export declare const imageManifest: Record<AlmaImageFullName, () => Promise<any>> &
  Partial<Record<AlmaLegacyImageFullName, () => Promise<any>>>;
export default imageManifest;

export type { AlmaImageFullName, AlmaLegacyImageFullName, ImageFullName };
`;
}

function renderIndexJs() {
  return `// AUTO-GENERATED by AlmaImagesResolver

export * from "./metadata.js";
export * from "./manifest.js";
export { default } from "./manifest.js";
`;
}

function renderIndexDts() {
  return `// AUTO-GENERATED by AlmaImagesResolver

export * from "./metadata.js";
export * from "./manifest.js";
export { default } from "./manifest.js";
`;
}

function renderReactImage({ componentName, fullPath }: ImageFile) {
  const svg = extractSvg(readFileSync(fullPath, "utf8"), fullPath);
  const baseProps: Record<string, string> = {
    viewBox: svg.viewBox,
    fill: svg.fill ?? "none",
    xmlns: svg.xmlns,
  };

  return `// AUTO-GENERATED by AlmaImagesResolver

import * as React from "react";

const svgBaseProps = ${JSON.stringify(baseProps, null, 2)};
const svgInner = ${JSON.stringify(svg.inner)};

export default function ${componentName}({
  size = "1em",
  title,
  decorative = true,
  width,
  height,
  ...props
}) {
  const accessibilityProps =
    decorative || !title ? { "aria-hidden": "true" } : { role: "img" };
  const children = [];

  if (title && !decorative) {
    children.push(React.createElement("title", { key: "title" }, title));
  }

  children.push(
    React.createElement("g", {
      key: "image",
      dangerouslySetInnerHTML: { __html: svgInner },
    })
  );

  return React.createElement(
    "svg",
    {
      ...svgBaseProps,
      ...props,
      ...accessibilityProps,
      width: width ?? size,
      height: height ?? size,
      focusable: "false",
    },
    children
  );
}
`;
}

function renderReactImageDts(componentName: string) {
  return `// AUTO-GENERATED by AlmaImagesResolver

import type { AlmaReactImageProps } from "../index.js";

declare function ${componentName}(props: AlmaReactImageProps): import("react").ReactElement | null;
export default ${componentName};
`;
}

function renderReactIndexJs() {
  return `// AUTO-GENERATED by AlmaImagesResolver

import * as React from "react";
import { hasImageVariant, resolveImageKey } from "../metadata.js";
import { reactImageManifest } from "./manifest.js";

export { hasImageVariant, resolveImageKey } from "../metadata.js";

export function AlmaImage({
  name,
  appearance = "outline",
  weight = "400",
  size = "1em",
  title,
  decorative = true,
  fallback = null,
  onMissingImage,
  ...props
}) {
  const key = resolveImageKey({ name, appearance: appearance, weight });
  const [Image, setImage] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    const loader = hasImageVariant({ name, appearance: appearance, weight }) ? reactImageManifest[key] : undefined;

    if (!loader) {
      setImage(null);
      onMissingImage?.(key);
      return () => {
        cancelled = true;
      };
    }

    setImage(null);
    loader()
      .then((module) => {
        if (!cancelled) {
          setImage(() => module.default ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setImage(null);
          onMissingImage?.(key);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, name, appearance, weight, onMissingImage]);

  if (!Image) {
    return fallback;
  }

  return React.createElement(Image, {
    ...props,
    size,
    title,
    decorative,
  });
}
`;
}

function renderReactIndexDts() {
  return `// AUTO-GENERATED by AlmaImagesResolver

import type * as React from "react";
import type { AlmaImageName, AlmaImageAppearance, AlmaImageWeight } from "../metadata.js";

export type AlmaReactImageProps = {
  size?: number | string;
  title?: string;
  decorative?: boolean;
  className?: string;
  style?: React.CSSProperties;
} & React.SVGProps<SVGSVGElement>;

export type AlmaImageProps = {
  name: AlmaImageName;
  appearance?: AlmaImageAppearance;
  weight?: AlmaImageWeight;
  size?: number | string;
  title?: string;
  decorative?: boolean;
  fallback?: React.ReactNode;
  onMissingImage?: (key: string) => void;
} & Omit<AlmaReactImageProps, "name">;

export declare function AlmaImage(props: AlmaImageProps): React.ReactNode;

export { hasImageVariant, resolveImageKey } from "../metadata.js";
export type {
  AlmaImageFullName,
  AlmaImageName,
  AlmaImageAppearance,
  AlmaImageWeight,
  ImageFullName,
  ImageName,
  ImageAppearance,
  ImageWeight,
} from "../metadata.js";
`;
}

function renderVueImage({ componentName, fullPath }: ImageFile) {
  const svg = extractSvg(readFileSync(fullPath, "utf8"), fullPath);
  const baseProps: Record<string, string> = {
    viewBox: svg.viewBox,
    fill: svg.fill ?? "none",
    xmlns: svg.xmlns,
  };

  return `// AUTO-GENERATED by AlmaImagesResolver

import { defineComponent, h } from "vue";

const svgBaseProps = ${JSON.stringify(baseProps, null, 2)};
const svgInner = ${JSON.stringify(svg.inner)};

export default defineComponent({
  name: ${quote(componentName)},
  inheritAttrs: false,
  props: {
    size: { type: [Number, String], default: "1em" },
    title: { type: String, default: undefined },
    decorative: { type: Boolean, default: true },
  },
  setup(props, { attrs }) {
    return () => {
      const accessibilityProps =
        props.decorative || !props.title ? { "aria-hidden": "true" } : { role: "img" };
      const children = [];

      if (props.title && !props.decorative) {
        children.push(h("title", { key: "title" }, props.title));
      }

      children.push(h("g", { key: "image", innerHTML: svgInner }));

      return h(
        "svg",
        {
          ...svgBaseProps,
          ...attrs,
          ...accessibilityProps,
          width: attrs.width ?? props.size,
          height: attrs.height ?? props.size,
          focusable: "false",
        },
        children
      );
    };
  },
});
`;
}

function renderVueImageDts(componentName: string) {
  return `// AUTO-GENERATED by AlmaImagesResolver

import type { DefineComponent } from "vue";
import type { AlmaVueImageProps } from "../index.js";

declare const ${componentName}: DefineComponent<AlmaVueImageProps>;
export default ${componentName};
`;
}

function renderVueIndexJs() {
  return `// AUTO-GENERATED by AlmaImagesResolver

import { defineComponent, h, shallowRef, watch } from "vue";
import { hasImageVariant, resolveImageKey } from "../metadata.js";
import { vueImageManifest } from "./manifest.js";

export { hasImageVariant, resolveImageKey } from "../metadata.js";

export const AlmaImage = defineComponent({
  name: "AlmaImage",
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    appearance: { type: String, default: "outline" },
    weight: { type: String, default: "400" },
    size: { type: [Number, String], default: "1em" },
    title: { type: String, default: undefined },
    decorative: { type: Boolean, default: true },
    fallback: { type: null, default: null },
    onMissingImage: { type: Function, default: undefined },
  },
  setup(props, { attrs }) {
    const Image = shallowRef(null);
    let loadId = 0;

    watch(
      () => [props.name, props.appearance, props.weight],
      () => {
        const currentLoadId = ++loadId;
        const key = resolveImageKey({
          name: props.name,
          appearance: props.appearance,
          weight: props.weight,
        });
        const loader = hasImageVariant({
          name: props.name,
          appearance: props.appearance,
          weight: props.weight,
        })
          ? vueImageManifest[key]
          : undefined;

        if (!loader) {
          Image.value = null;
          props.onMissingImage?.(key);
          return;
        }

        Image.value = null;
        loader()
          .then((module) => {
            if (currentLoadId === loadId) {
              Image.value = module.default ?? null;
            }
          })
          .catch(() => {
            if (currentLoadId === loadId) {
              Image.value = null;
            }
            props.onMissingImage?.(key);
          });
      },
      { immediate: true }
    );

    return () => {
      if (!Image.value) {
        return props.fallback ?? null;
      }

      return h(Image.value, {
        ...attrs,
        size: props.size,
        title: props.title,
        decorative: props.decorative,
      });
    };
  },
});

export default AlmaImage;
`;
}

function renderVueIndexDts() {
  return `// AUTO-GENERATED by AlmaImagesResolver

import type { DefineComponent, VNodeChild } from "vue";
import type { AlmaImageName, AlmaImageAppearance, AlmaImageWeight } from "../metadata.js";

export type AlmaVueImageProps = {
  size?: number | string;
  title?: string;
  decorative?: boolean;
};

export type AlmaImageProps = AlmaVueImageProps & {
  name: AlmaImageName;
  appearance?: AlmaImageAppearance;
  weight?: AlmaImageWeight;
  fallback?: VNodeChild;
  onMissingImage?: (key: string) => void;
};

export declare const AlmaImage: DefineComponent<AlmaImageProps>;
export default AlmaImage;

export { hasImageVariant, resolveImageKey } from "../metadata.js";
export type {
  AlmaImageFullName,
  AlmaImageName,
  AlmaImageAppearance,
  AlmaImageWeight,
  ImageFullName,
  ImageName,
  ImageAppearance,
  ImageWeight,
} from "../metadata.js";
`;
}

function renderImagesIndex(entries: ImageFile[]) {
  return entries
    .map(({ componentName }) => `export { default as ${componentName} } from "./${componentName}.js";`)
    .join("\n");
}

function renderReactImagesIndexDts(entries: ImageFile[]) {
  return `// AUTO-GENERATED by AlmaImagesResolver

${entries
  .map(({ componentName }) => `export { default as ${componentName} } from "./${componentName}.js";`)
  .join("\n")}
`;
}

function renderVueImagesIndexDts(entries: ImageFile[]) {
  return `// AUTO-GENERATED by AlmaImagesResolver

${entries
  .map(({ componentName }) => `export { default as ${componentName} } from "./${componentName}.js";`)
  .join("\n")}
`;
}

const releaseGenerationLock = await acquireGenerationLock();
process.once("exit", releaseGenerationLock);

const files = walk(imagesDir);
const componentNameCounts = new Map<string, number>();

const parsed = files.map((fullPath) => {
  const parsedName = parseFileName(fullPath);
  const baseComponentName = toComponentName(parsedName);
  const count = componentNameCounts.get(baseComponentName) ?? 0;
  componentNameCounts.set(baseComponentName, count + 1);

  const componentName = count === 0 ? baseComponentName : `${baseComponentName}${count + 1}`;
  const sourceRel = relative(root, fullPath).replace(/\\/g, "/");
  const isAlmaVariant =
    isSupportedAppearance(parsedName.appearance) && isSupportedWeight(parsedName.weight);

  return {
    ...parsedName,
    fullPath,
    sourceRel,
    componentName,
    isAlmaVariant,
  };
});

parsed.sort((a, b) => a.key.localeCompare(b.key));

const validEntries = parsed.filter(({ isAlmaVariant }) => isAlmaVariant);
const legacyEntries = parsed.filter(({ isAlmaVariant }) => !isAlmaVariant);

cleanDir(distDir);
ensureDir(reactImagesDir);
ensureDir(vueImagesDir);

writeGenerated(join(distDir, "metadata.js"), renderMetadataJs(validEntries, legacyEntries));
writeGenerated(join(distDir, "metadata.d.ts"), renderMetadataDts(validEntries, legacyEntries));
writeGenerated(
  join(distDir, "manifest.js"),
  `// AUTO-GENERATED by AlmaImagesResolver

export const imageManifest = {
${renderManifest(parsed, "../")}
};

export default imageManifest;
`
);
writeGenerated(join(distDir, "manifest.d.ts"), renderManifestDts());
writeGenerated(join(distDir, "index.js"), renderIndexJs());
writeGenerated(join(distDir, "index.d.ts"), renderIndexDts());

writeGenerated(
  join(reactDir, "manifest.js"),
  `// AUTO-GENERATED by AlmaImagesResolver

export const reactImageManifest = {
${renderComponentManifest(validEntries)}
};
`
);
writeGenerated(
  join(reactDir, "manifest.d.ts"),
  `// AUTO-GENERATED by AlmaImagesResolver

import type { AlmaImageFullName } from "../metadata.js";

export declare const reactImageManifest: Record<AlmaImageFullName, () => Promise<any>>;
`
);
writeGenerated(join(reactDir, "index.js"), renderReactIndexJs());
writeGenerated(join(reactDir, "index.d.ts"), renderReactIndexDts());
writeGenerated(
  join(reactImagesDir, "index.js"),
  `// AUTO-GENERATED by AlmaImagesResolver

${renderImagesIndex(parsed)}
`
);
writeGenerated(join(reactImagesDir, "index.d.ts"), renderReactImagesIndexDts(parsed));

writeGenerated(
  join(vueDir, "manifest.js"),
  `// AUTO-GENERATED by AlmaImagesResolver

export const vueImageManifest = {
${renderComponentManifest(validEntries)}
};
`
);
writeGenerated(
  join(vueDir, "manifest.d.ts"),
  `// AUTO-GENERATED by AlmaImagesResolver

import type { AlmaImageFullName } from "../metadata.js";

export declare const vueImageManifest: Record<AlmaImageFullName, () => Promise<any>>;
`
);
writeGenerated(join(vueDir, "index.js"), renderVueIndexJs());
writeGenerated(join(vueDir, "index.d.ts"), renderVueIndexDts());
writeGenerated(
  join(vueImagesDir, "index.js"),
  `// AUTO-GENERATED by AlmaImagesResolver

${renderImagesIndex(parsed)}
`
);
writeGenerated(join(vueImagesDir, "index.d.ts"), renderVueImagesIndexDts(parsed));

for (const image of parsed) {
  writeGenerated(join(reactImagesDir, `${image.componentName}.js`), renderReactImage(image));
  writeGenerated(join(reactImagesDir, `${image.componentName}.d.ts`), renderReactImageDts(image.componentName));
  writeGenerated(join(vueImagesDir, `${image.componentName}.js`), renderVueImage(image));
  writeGenerated(join(vueImagesDir, `${image.componentName}.d.ts`), renderVueImageDts(image.componentName));
}

writeGenerated(
  join(root, "index.js"),
  `// AUTO-GENERATED by AlmaImagesResolver

export * from "./dist/index.js";
export { default } from "./dist/index.js";
`
);
writeGenerated(
  join(root, "index.d.ts"),
  `// AUTO-GENERATED by AlmaImagesResolver

export * from "./dist/index.js";
export { default } from "./dist/index.js";
`
);

console.log(
  `Generated Alma Images: ${parsed.length} SVGs, ` +
    `${validEntries.length} typed variants, ${legacyEntries.length} legacy variants`
);

releaseGenerationLock();
