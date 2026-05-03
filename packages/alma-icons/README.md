# AlmaIcons

![image](https://github.com/yamogoo/alma-icons/blob/main/shared/images/alma-icons-logo--lg.png)

![Version](https://img.shields.io/badge/version-3.2.1-green)

[![License: CC BY-NC](https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc.svg)](./LICENSE)

![image](https://github.com/yamogoo/alma-icons/blob/main/shared/images/alma-icons--md.gif)

Alma Icons is a **production-ready icon system** designed for scalable UI products.

The library includes **1206 icons** (603 outline, 603 fill) built on a consistent **100–500 weight stroke system** with a stable, versioned taxonomy.

Perfect for design systems, product interfaces, and long-term UI development.

- **1206 icons** (603 outline, 603 fill)
- **2 styles**: `fill` & `outline`
- **5 weights**: `100` - `500`
- Stable, scalable taxonomy
- Strict geometric consistency

## Demo

🌐 [almaicons.netlify.app](https://almaicons.netlify.app/)

## Figma Community

Explore the full library in Figma:

👉 https://www.figma.com/community/file/1607825775789504167/alma-icons

## Preview

Here are just a few examples (each available in 2 styles × 5 weights):

| Icon name      | Fill (300)                                                                                               | Outline (300)                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `rocket`       | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/rocket_fill_300.svg)       | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/rocket_outline_300.svg)       |
| `football`     | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/football_fill_300.svg)     | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/football_outline_300.svg)     |
| `bag`          | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/shoppingBag_fill_300.svg)  | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/shoppingBag_outline_300.svg)  |
| `folderClosed` | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/folderClosed_fill_300.svg) | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/folderClosed_outline_300.svg) |

> 👉 Every icon supports **weights 100 → 500**.

## Installation

Using **pnpm**:

```bash
pnpm add alma-icons
```

Using **npm**:

```bash
npm install alma-icons
```

Using **yarn**:

```bash
yarn add alma-icons
```

## Usage

Alma Icons supports two integration modes.

### Static mode

Static mode is recommended for production UI. Import only the icons your app uses; bundlers can tree-shake the rest, and direct icon components are SSR-friendly.

React:

```tsx
import { SearchOutline400 } from "alma-icons/react/icons";

export function SearchButton() {
  return <SearchOutline400 size={20} title="Search" decorative={false} />;
}
```

Direct per-icon React import:

```tsx
import SearchOutline400 from "alma-icons/react/icons/SearchOutline400";
```

Vue:

```vue
<script setup lang="ts">
import { SearchOutline400 } from "alma-icons/vue/icons";
</script>

<template>
  <SearchOutline400 :size="20" title="Search" :decorative="false" />
</template>
```

Direct per-icon Vue import:

```ts
import SearchOutline400 from "alma-icons/vue/icons/SearchOutline400";
```

### Dynamic mode

Dynamic mode is for icon browsers, search UIs, plugin UIs, previews, and other places where the icon name is chosen at runtime. It uses a lazy generated manifest and resolves icons by name, style, and weight.

React:

```tsx
import { AlmaIcon } from "alma-icons/react";

export function Preview() {
  return <AlmaIcon name="search" appearance="outline" weight="400" size={20} />;
}
```

Vue:

```vue
<script setup lang="ts">
import { AlmaIcon } from "alma-icons/vue";
</script>

<template>
  <AlmaIcon name="search" appearance="outline" weight="400" :size="20" />
</template>
```

The root package also exposes metadata and the backwards-compatible lazy SVG manifest:

```ts
import {
  iconManifest,
  iconNames,
  iconStyles,
  iconWeights,
  hasIconVariant,
  resolveIconKey,
  type AlmaIconName,
  type AlmaIconStyle,
  type AlmaIconWeight,
} from "alma-icons";

const key = resolveIconKey({ name: "search", style: "outline", weight: "400" });
const exists = hasIconVariant({
  name: "search",
  style: "outline",
  weight: "400",
});
```

> Package examples use the current package name, `alma-icons`. If you publish split scoped entry packages, the same generated API maps to `@alma-icons/react`, `@alma-icons/react/icons`, `@alma-icons/vue`, and `@alma-icons/vue/icons`.

## Development

To regenerate icons after adding new SVG files, run from the repository root or `packages/alma-icons`:

```bash
pnpm generate
```

This updates `dist/`, `index.js`, and `index.d.ts` with metadata, the lazy SVG manifest, and generated React/Vue components.

To validate the generated package surface, run from the repository root or `packages/alma-icons`:

```bash
pnpm validate
```

## License

Alma Icons © 2025–2026 [Misha Grebennikov](https://github.com/yamogoo)  
https://github.com/yamogoo

Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)
.

- You must give appropriate credit, provide a link to the license, and indicate if changes were made.

- **You may not use the icons for commercial purposes.**
