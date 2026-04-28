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
const iconsDir = join(root, "icons");
const distDir = join(root, "dist");
const reactDir = join(distDir, "react");
const reactIconsDir = join(reactDir, "icons");
const vueDir = join(distDir, "vue");
const vueIconsDir = join(vueDir, "icons");

const supportedStyles = ["outline", "fill"] as const;
const supportedWeights = ["100", "200", "300", "400", "500"] as const;

type SupportedStyle = (typeof supportedStyles)[number];
type SupportedWeight = (typeof supportedWeights)[number];

type IconFile = {
  key: string;
  name: string;
  style: string;
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
        throw new Error(`Timed out waiting for Alma Icons generation lock: ${lockDir}`);
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
    throw new Error(`Unexpected icon name format: ${base}`);
  }

  const [name, style, weight] = parts;
  return { key, name, style, weight };
}

function isSupportedStyle(style: string): style is SupportedStyle {
  return (supportedStyles as readonly string[]).includes(style);
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

function toComponentName({ name, style, weight }: Pick<IconFile, "name" | "style" | "weight">) {
  const componentName = `${toPascalCase(name)}${toPascalCase(style)}${toPascalCase(weight)}`;

  if (!/^[A-Za-z]/.test(componentName)) {
    return `Icon${componentName}`;
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

function renderManifest(entries: IconFile[], importPrefix: string) {
  return entries
    .map(({ key, sourceRel }) => `  ${quote(key)}: () => import(${quote(`${importPrefix}${sourceRel}`)})`)
    .join(",\n");
}

function renderComponentManifest(entries: IconFile[]) {
  return entries
    .map(({ key, componentName }) => `  ${quote(key)}: () => import(${quote(`./icons/${componentName}.js`)})`)
    .join(",\n");
}

function renderMetadataDts(validEntries: IconFile[], legacyEntries: IconFile[]) {
  const names = [...new Set(validEntries.map(({ name }) => name))].sort((a, b) => a.localeCompare(b));
  const fullNames = validEntries.map(({ key }) => key);
  const legacyFullNames = legacyEntries.map(({ key }) => key);

  return `// AUTO-GENERATED by AlmaIconsResolver

export type AlmaIconName =
${union(names)};

export type AlmaIconStyle = "outline" | "fill";
export type AlmaIconWeight = "100" | "200" | "300" | "400" | "500";
export type AlmaIconFullName = \`\${AlmaIconName}_\${AlmaIconStyle}_\${AlmaIconWeight}\`;

export type AlmaLegacyIconFullName =
${union(legacyFullNames)};

export type IconName = AlmaIconName;
export type IconStyle = AlmaIconStyle;
export type IconWeight = AlmaIconWeight;
export type IconFullName = AlmaIconFullName | AlmaLegacyIconFullName;

export type ResolveIconKeyOptions = {
  name: AlmaIconName;
  style?: AlmaIconStyle;
  weight?: AlmaIconWeight;
};

export type IconVariantOptions = {
  name: AlmaIconName;
  style: AlmaIconStyle;
  weight: AlmaIconWeight;
};

export declare const iconNames: readonly AlmaIconName[];
export declare const iconStyles: readonly AlmaIconStyle[];
export declare const iconWeights: readonly AlmaIconWeight[];
export declare const iconFullNames: readonly AlmaIconFullName[];
export declare const legacyIconFullNames: readonly AlmaLegacyIconFullName[];
export declare function resolveIconKey(options: ResolveIconKeyOptions): AlmaIconFullName;
export declare function hasIconVariant(options: IconVariantOptions): boolean;
`;
}

function renderMetadataJs(validEntries: IconFile[], legacyEntries: IconFile[]) {
  const names = [...new Set(validEntries.map(({ name }) => name))].sort((a, b) => a.localeCompare(b));
  const fullNames = validEntries.map(({ key }) => key);
  const legacyFullNames = legacyEntries.map(({ key }) => key);

  return `// AUTO-GENERATED by AlmaIconsResolver

export const iconNames = ${JSON.stringify(names, null, 2)};
export const iconStyles = ${JSON.stringify(supportedStyles, null, 2)};
export const iconWeights = ${JSON.stringify(supportedWeights, null, 2)};
export const iconFullNames = ${JSON.stringify(fullNames, null, 2)};
export const legacyIconFullNames = ${JSON.stringify(legacyFullNames, null, 2)};

const iconFullNameSet = new Set(iconFullNames);

export function resolveIconKey({ name, style = "outline", weight = "400" }) {
  return \`\${name}_\${style}_\${weight}\`;
}

export function hasIconVariant({ name, style, weight }) {
  return iconFullNameSet.has(resolveIconKey({ name, style, weight }));
}
`;
}

function renderManifestDts() {
  return `// AUTO-GENERATED by AlmaIconsResolver

import type { AlmaIconFullName, AlmaLegacyIconFullName, IconFullName } from "./metadata.js";

export declare const iconManifest: Record<AlmaIconFullName, () => Promise<any>> &
  Partial<Record<AlmaLegacyIconFullName, () => Promise<any>>>;
export default iconManifest;

export type { AlmaIconFullName, AlmaLegacyIconFullName, IconFullName };
`;
}

function renderIndexJs() {
  return `// AUTO-GENERATED by AlmaIconsResolver

export * from "./metadata.js";
export * from "./manifest.js";
export { default } from "./manifest.js";
`;
}

function renderIndexDts() {
  return `// AUTO-GENERATED by AlmaIconsResolver

export * from "./metadata.js";
export * from "./manifest.js";
export { default } from "./manifest.js";
`;
}

function renderReactIcon({ componentName, fullPath }: IconFile) {
  const svg = extractSvg(readFileSync(fullPath, "utf8"), fullPath);
  const baseProps: Record<string, string> = {
    viewBox: svg.viewBox,
    fill: svg.fill ?? "none",
    xmlns: svg.xmlns,
  };

  return `// AUTO-GENERATED by AlmaIconsResolver

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
      key: "icon",
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

function renderReactIconDts(componentName: string) {
  return `// AUTO-GENERATED by AlmaIconsResolver

import type { AlmaReactIconProps } from "../index.js";

declare function ${componentName}(props: AlmaReactIconProps): import("react").ReactElement | null;
export default ${componentName};
`;
}

function renderReactIndexJs() {
  return `// AUTO-GENERATED by AlmaIconsResolver

import * as React from "react";
import { hasIconVariant, resolveIconKey } from "../metadata.js";
import { reactIconManifest } from "./manifest.js";

export { hasIconVariant, resolveIconKey } from "../metadata.js";

export function AlmaIcon({
  name,
  appearance = "outline",
  weight = "400",
  size = "1em",
  title,
  decorative = true,
  fallback = null,
  onMissingIcon,
  ...props
}) {
  const key = resolveIconKey({ name, style: appearance, weight });
  const [Icon, setIcon] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    const loader = hasIconVariant({ name, style: appearance, weight }) ? reactIconManifest[key] : undefined;

    if (!loader) {
      setIcon(null);
      onMissingIcon?.(key);
      return () => {
        cancelled = true;
      };
    }

    setIcon(null);
    loader()
      .then((module) => {
        if (!cancelled) {
          setIcon(() => module.default ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIcon(null);
          onMissingIcon?.(key);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, name, appearance, weight, onMissingIcon]);

  if (!Icon) {
    return fallback;
  }

  return React.createElement(Icon, {
    ...props,
    size,
    title,
    decorative,
  });
}
`;
}

function renderReactIndexDts() {
  return `// AUTO-GENERATED by AlmaIconsResolver

import type * as React from "react";
import type { AlmaIconName, AlmaIconStyle, AlmaIconWeight } from "../metadata.js";

export type AlmaReactIconProps = {
  size?: number | string;
  title?: string;
  decorative?: boolean;
  className?: string;
  style?: React.CSSProperties;
} & React.SVGProps<SVGSVGElement>;

export type AlmaIconProps = {
  name: AlmaIconName;
  appearance?: AlmaIconStyle;
  weight?: AlmaIconWeight;
  size?: number | string;
  title?: string;
  decorative?: boolean;
  fallback?: React.ReactNode;
  onMissingIcon?: (key: string) => void;
} & Omit<AlmaReactIconProps, "name">;

export declare function AlmaIcon(props: AlmaIconProps): React.ReactNode;

export { hasIconVariant, resolveIconKey } from "../metadata.js";
export type {
  AlmaIconFullName,
  AlmaIconName,
  AlmaIconStyle,
  AlmaIconWeight,
  IconFullName,
  IconName,
  IconStyle,
  IconWeight,
} from "../metadata.js";
`;
}

function renderVueIcon({ componentName, fullPath }: IconFile) {
  const svg = extractSvg(readFileSync(fullPath, "utf8"), fullPath);
  const baseProps: Record<string, string> = {
    viewBox: svg.viewBox,
    fill: svg.fill ?? "none",
    xmlns: svg.xmlns,
  };

  return `// AUTO-GENERATED by AlmaIconsResolver

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

      children.push(h("g", { key: "icon", innerHTML: svgInner }));

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

function renderVueIconDts(componentName: string) {
  return `// AUTO-GENERATED by AlmaIconsResolver

import type { DefineComponent } from "vue";
import type { AlmaVueIconProps } from "../index.js";

declare const ${componentName}: DefineComponent<AlmaVueIconProps>;
export default ${componentName};
`;
}

function renderVueIndexJs() {
  return `// AUTO-GENERATED by AlmaIconsResolver

import { defineComponent, h, shallowRef, watch } from "vue";
import { hasIconVariant, resolveIconKey } from "../metadata.js";
import { vueIconManifest } from "./manifest.js";

export { hasIconVariant, resolveIconKey } from "../metadata.js";

export const AlmaIcon = defineComponent({
  name: "AlmaIcon",
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    appearance: { type: String, default: "outline" },
    weight: { type: String, default: "400" },
    size: { type: [Number, String], default: "1em" },
    title: { type: String, default: undefined },
    decorative: { type: Boolean, default: true },
    fallback: { type: null, default: null },
    onMissingIcon: { type: Function, default: undefined },
  },
  setup(props, { attrs }) {
    const Icon = shallowRef(null);
    let loadId = 0;

    watch(
      () => [props.name, props.appearance, props.weight],
      () => {
        const currentLoadId = ++loadId;
        const key = resolveIconKey({
          name: props.name,
          style: props.appearance,
          weight: props.weight,
        });
        const loader = hasIconVariant({
          name: props.name,
          style: props.appearance,
          weight: props.weight,
        })
          ? vueIconManifest[key]
          : undefined;

        if (!loader) {
          Icon.value = null;
          props.onMissingIcon?.(key);
          return;
        }

        Icon.value = null;
        loader()
          .then((module) => {
            if (currentLoadId === loadId) {
              Icon.value = module.default ?? null;
            }
          })
          .catch(() => {
            if (currentLoadId === loadId) {
              Icon.value = null;
            }
            props.onMissingIcon?.(key);
          });
      },
      { immediate: true }
    );

    return () => {
      if (!Icon.value) {
        return props.fallback ?? null;
      }

      return h(Icon.value, {
        ...attrs,
        size: props.size,
        title: props.title,
        decorative: props.decorative,
      });
    };
  },
});

export default AlmaIcon;
`;
}

function renderVueIndexDts() {
  return `// AUTO-GENERATED by AlmaIconsResolver

import type { DefineComponent, VNodeChild } from "vue";
import type { AlmaIconName, AlmaIconStyle, AlmaIconWeight } from "../metadata.js";

export type AlmaVueIconProps = {
  size?: number | string;
  title?: string;
  decorative?: boolean;
};

export type AlmaIconProps = AlmaVueIconProps & {
  name: AlmaIconName;
  appearance?: AlmaIconStyle;
  weight?: AlmaIconWeight;
  fallback?: VNodeChild;
  onMissingIcon?: (key: string) => void;
};

export declare const AlmaIcon: DefineComponent<AlmaIconProps>;
export default AlmaIcon;

export { hasIconVariant, resolveIconKey } from "../metadata.js";
export type {
  AlmaIconFullName,
  AlmaIconName,
  AlmaIconStyle,
  AlmaIconWeight,
  IconFullName,
  IconName,
  IconStyle,
  IconWeight,
} from "../metadata.js";
`;
}

function renderIconsIndex(entries: IconFile[]) {
  return entries
    .map(({ componentName }) => `export { default as ${componentName} } from "./${componentName}.js";`)
    .join("\n");
}

function renderReactIconsIndexDts(entries: IconFile[]) {
  return `// AUTO-GENERATED by AlmaIconsResolver

${entries
  .map(({ componentName }) => `export { default as ${componentName} } from "./${componentName}.js";`)
  .join("\n")}
`;
}

function renderVueIconsIndexDts(entries: IconFile[]) {
  return `// AUTO-GENERATED by AlmaIconsResolver

${entries
  .map(({ componentName }) => `export { default as ${componentName} } from "./${componentName}.js";`)
  .join("\n")}
`;
}

const releaseGenerationLock = await acquireGenerationLock();
process.once("exit", releaseGenerationLock);

const files = walk(iconsDir);
const componentNameCounts = new Map<string, number>();

const parsed = files.map((fullPath) => {
  const parsedName = parseFileName(fullPath);
  const baseComponentName = toComponentName(parsedName);
  const count = componentNameCounts.get(baseComponentName) ?? 0;
  componentNameCounts.set(baseComponentName, count + 1);

  const componentName = count === 0 ? baseComponentName : `${baseComponentName}${count + 1}`;
  const sourceRel = relative(root, fullPath).replace(/\\/g, "/");
  const isAlmaVariant =
    isSupportedStyle(parsedName.style) && isSupportedWeight(parsedName.weight);

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
ensureDir(reactIconsDir);
ensureDir(vueIconsDir);

writeGenerated(join(distDir, "metadata.js"), renderMetadataJs(validEntries, legacyEntries));
writeGenerated(join(distDir, "metadata.d.ts"), renderMetadataDts(validEntries, legacyEntries));
writeGenerated(
  join(distDir, "manifest.js"),
  `// AUTO-GENERATED by AlmaIconsResolver

export const iconManifest = {
${renderManifest(parsed, "../")}
};

export default iconManifest;
`
);
writeGenerated(join(distDir, "manifest.d.ts"), renderManifestDts());
writeGenerated(join(distDir, "index.js"), renderIndexJs());
writeGenerated(join(distDir, "index.d.ts"), renderIndexDts());

writeGenerated(
  join(reactDir, "manifest.js"),
  `// AUTO-GENERATED by AlmaIconsResolver

export const reactIconManifest = {
${renderComponentManifest(validEntries)}
};
`
);
writeGenerated(
  join(reactDir, "manifest.d.ts"),
  `// AUTO-GENERATED by AlmaIconsResolver

import type { AlmaIconFullName } from "../metadata.js";

export declare const reactIconManifest: Record<AlmaIconFullName, () => Promise<any>>;
`
);
writeGenerated(join(reactDir, "index.js"), renderReactIndexJs());
writeGenerated(join(reactDir, "index.d.ts"), renderReactIndexDts());
writeGenerated(
  join(reactIconsDir, "index.js"),
  `// AUTO-GENERATED by AlmaIconsResolver

${renderIconsIndex(parsed)}
`
);
writeGenerated(join(reactIconsDir, "index.d.ts"), renderReactIconsIndexDts(parsed));

writeGenerated(
  join(vueDir, "manifest.js"),
  `// AUTO-GENERATED by AlmaIconsResolver

export const vueIconManifest = {
${renderComponentManifest(validEntries)}
};
`
);
writeGenerated(
  join(vueDir, "manifest.d.ts"),
  `// AUTO-GENERATED by AlmaIconsResolver

import type { AlmaIconFullName } from "../metadata.js";

export declare const vueIconManifest: Record<AlmaIconFullName, () => Promise<any>>;
`
);
writeGenerated(join(vueDir, "index.js"), renderVueIndexJs());
writeGenerated(join(vueDir, "index.d.ts"), renderVueIndexDts());
writeGenerated(
  join(vueIconsDir, "index.js"),
  `// AUTO-GENERATED by AlmaIconsResolver

${renderIconsIndex(parsed)}
`
);
writeGenerated(join(vueIconsDir, "index.d.ts"), renderVueIconsIndexDts(parsed));

for (const icon of parsed) {
  writeGenerated(join(reactIconsDir, `${icon.componentName}.js`), renderReactIcon(icon));
  writeGenerated(join(reactIconsDir, `${icon.componentName}.d.ts`), renderReactIconDts(icon.componentName));
  writeGenerated(join(vueIconsDir, `${icon.componentName}.js`), renderVueIcon(icon));
  writeGenerated(join(vueIconsDir, `${icon.componentName}.d.ts`), renderVueIconDts(icon.componentName));
}

writeGenerated(
  join(root, "index.js"),
  `// AUTO-GENERATED by AlmaIconsResolver

export * from "./dist/index.js";
export { default } from "./dist/index.js";
`
);
writeGenerated(
  join(root, "index.d.ts"),
  `// AUTO-GENERATED by AlmaIconsResolver

export * from "./dist/index.js";
export { default } from "./dist/index.js";
`
);

console.log(
  `Generated Alma Icons: ${parsed.length} SVGs, ` +
    `${validEntries.length} typed variants, ${legacyEntries.length} legacy variants`
);

releaseGenerationLock();
