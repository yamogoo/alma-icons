> **Trademark Disclaimer**
>
> All product names, logos, brands, and trademarks featured or referenced in this repository are the property of their respective owners.
> This project is not affiliated with, endorsed by, sponsored by, or associated with any trademark owner.
> Brand assets are provided solely for developer convenience, interface prototyping, educational purposes, and design system workflows.

# AlmaBrands

![Version](https://img.shields.io/badge/version-1.3.0-green)

[![License: MIT](https://img.shields.io/badge/license-MIT-black.svg)](./LICENSE)

Alma Brands is a structured brand asset system for scalable UI products, design tools, runtime interfaces, and developer workflows.

The library provides normalized SVG brand assets with a stable, versioned taxonomy and generated React/Vue component exports. It is designed to work as a companion package to Alma Icons while keeping brand assets, naming, licensing notes, and package lifecycle separate.

- **63 unique brand assets**
- **2 primary variants**: `mark` & `standard`
- Multiple appearances, including `color` and `monochrome`
- Stable, scalable taxonomy
- SSR-friendly React and Vue components
- Tree-shakeable static imports
- Runtime-ready dynamic component API

## Naming Topology

Alma Brands uses a deterministic naming structure:

```txt
<name>_<variant>_<appearance>
```

Examples:

```txt
figma_mark_monochrome
github_mark_color
openai_standard_monochrome
stripe_standard_color
```

## Categories

The library currently includes brand assets for:

- Dev Apps
- AI / LLM
- Tech Stack
- Payments / SaaS
- Cloud / Infra
- Browsers
- Social
- Design Apps
- CI/CD
- Dev Frameworks
- Brand Assets

## Demo

🌐 [almaicons.netlify.app](https://almaicons.netlify.app/)

## Installation

Using **pnpm**:

```bash
pnpm add alma-brands
```

Using **npm**:

```bash
npm install alma-brands
```

Using **yarn**:

```bash
yarn add alma-brands
```

## Usage

Alma Brands supports two integration modes.

### Static mode

Static mode is recommended for production UI. Import only the brand assets your app uses; bundlers can tree-shake the rest, and direct components are SSR-friendly.

React:

```tsx
import { FigmaMarkMonochrome } from "alma-brands/react/icons";

export function FigmaLink() {
  return <FigmaMarkMonochrome />;
}
```

Direct per-icon React import:

```tsx
import FigmaMarkMonochrome from "alma-brands/react/icons/FigmaMarkMonochrome";
```

Vue:

```vue
<script setup lang="ts">
import { FigmaMarkMonochrome } from "alma-brands/vue/icons";
</script>

<template>
  <FigmaMarkMonochrome />
</template>
```

Direct per-icon Vue import:

```ts
import FigmaMarkMonochrome from "alma-brands/vue/icons/FigmaMarkMonochrome";
```

### Dynamic mode

Dynamic mode is for brand browsers, search UIs, plugin UIs, previews, dashboards, and other places where the brand asset is chosen at runtime. It uses a lazy generated manifest and resolves assets by name, variant, and appearance.

React:

```tsx
import { AlmaBrand } from "alma-brands/react";

export function Preview() {
  return <AlmaBrand name="figma" variant="mark" appearance="monochrome" />;
}
```

Vue:

```vue
<script setup lang="ts">
import { AlmaBrand } from "alma-brands/vue";
</script>

<template>
  <AlmaBrand name="figma" variant="mark" appearance="monochrome" />
</template>
```

The root package also exposes metadata and the generated lazy SVG manifest:

```ts
import {
  brandManifest,
  brandNames,
  brandVariants,
  brandAppearances,
  hasBrandVariant,
  resolveBrandKey,
  type AlmaBrandName,
  type AlmaBrandVariant,
  type AlmaBrandAppearance,
} from "alma-brands";

const key = resolveBrandKey({
  name: "figma",
  variant: "mark",
  appearance: "monochrome",
});

const exists = hasBrandVariant({
  name: "figma",
  variant: "mark",
  appearance: "monochrome",
});
```

## License

Alma Brands, 2026 [Misha Grebennikov](https://github.com/yamogoo)  
https://github.com/yamogoo

Licensed under the [MIT License](./LICENSE).

Brand names, logos, and trademarks remain the property of their respective owners.
