# AlmaImages

![Version](https://img.shields.io/badge/version-0.0.1-green)

[![License: CC BY-NC](https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-nc.svg)](./LICENSE)

Alma Images is an experimental semantic SVG illustration system designed as a companion package to Alma Icons for product interfaces, metrics and runtime concepts.

The package uses the same stable taxonomy as `alma-icons`:

```txt
<name>_<appearance>_<weight>
```

Examples:

```txt
structure_outline_100
consistency_outline_300
timeToValue_outline_500
```

- **15 generated SVG variants**
- **3 semantic image concepts**: `consistency`, `structure`, `timeToValue`
- **5 weights**: `100` - `500`
- `outline` appearance available
- `fill` appearance reserved for future releases
- Generated React and Vue components
- Tree-shakeable static imports
- Runtime-ready dynamic image API

## Installation

Using **pnpm**:

```bash
pnpm add alma-images
```

Using **npm**:

```bash
npm install alma-images
```

Using **yarn**:

```bash
yarn add alma-images
```

## Usage

Alma Images supports static and dynamic integration modes.

### Static mode

Static mode is recommended for production UI. Import only the images your app uses; bundlers can tree-shake the rest, and direct components are SSR-friendly.

React:

```tsx
import { StructureOutline400 } from "alma-images/react/images";

export function EmptyState() {
  return <StructureOutline400 size={48} />;
}
```

Direct per-image React import:

```tsx
import StructureOutline400 from "alma-images/react/images/StructureOutline400";
```

Vue:

```vue
<script setup lang="ts">
import { StructureOutline400 } from "alma-images/vue/images";
</script>

<template>
  <StructureOutline400 :size="48" />
</template>
```

Direct per-image Vue import:

```ts
import StructureOutline400 from "alma-images/vue/images/StructureOutline400";
```

### Dynamic mode

Dynamic mode is for browsers, search UIs, plugin UIs, previews, dashboards, and other places where the image is chosen at runtime.

React:

```tsx
import { AlmaImage } from "alma-images/react";

export function Preview() {
  return (
    <AlmaImage name="structure" appearance="outline" weight="400" size={48} />
  );
}
```

Vue:

```vue
<script setup lang="ts">
import { AlmaImage } from "alma-images/vue";
</script>

<template>
  <AlmaImage name="structure" appearance="outline" weight="400" :size="48" />
</template>
```

The root package exposes metadata and a lazy SVG manifest:

```ts
import {
  imageManifest,
  imageNames,
  imageAppearances,
  imageWeights,
  hasImageVariant,
  resolveImageKey,
  type AlmaImageName,
  type AlmaImageAppearance,
  type AlmaImageWeight,
} from "alma-images";

const key = resolveImageKey({
  name: "structure",
  appearance: "outline",
  weight: "400",
});

const exists = hasImageVariant({
  name: "structure",
  appearance: "outline",
  weight: "400",
});
```

## Development

To regenerate the package after adding SVG files, run from the repository root:

```bash
pnpm run generate:images
```

Or from `packages/alma-images`:

```bash
pnpm generate
```

To validate the generated package surface, run:

```bash
pnpm run validate:images
```

Or from `packages/alma-images`:

```bash
pnpm validate
```

## License

Alma Images © 2026 [Misha Grebennikov](https://github.com/yamogoo)

Licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
