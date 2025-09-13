# AlmaIcons

![image](https://github.com/yamogoo/alma-icons/blob/main/shared/images/alma-icons--md.gif)

The versatile collection of **450+ multi-weight icons** designed with varying stroke widths to seamlessly match different UI styles.  
Perfect for building modern, consistent interfaces with flexible visual weight.

- **2 styles**: `fill` & `outline`
- **5 weights**: `100` - `500`
- **448 unique icons**

## Demo

🌐 [almaicons.netlify.app](https://almaicons.netlify.app/)

## Preview

Here are just a few examples (each available in 2 styles × 5 weights):

| Icon name      | Fill (300)                                                                                               | Outline (300)                                                                                               |
| -------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `rocket`       | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/rocket_fill_300.svg)       | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/rocket_outline_300.svg)       |
| `football`     | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/football_fill_300.svg)     | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/football_outline_300.svg)     |
| `bag`          | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/bag_fill_300.svg)          | ![](https://github.com/yamogoo/alma-icons/blob/main/packages/alma-icons/icons/bag_outline_300.svg)          |
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

Import icons dynamically in your Vue or React project.

### Vue example

```vue
<!-- Icon.vue -->
<script setup lang="ts">
import { defineAsyncComponent, computed, markRaw } from "vue";

import { iconManifest, type IconFullName, type IconProps } from "./icon";

const props = defineProps<IconProps>();

const symbol = computed(() => {
  const { name, style, weight } = props;

  const key = `${name}_${style}_${weight}`;

  const loader = iconManifest[key as IconFullName];
  return loader ? markRaw(defineAsyncComponent(loader)) : null;
});
</script>

<template>
  <div class="icon" :class="[`icon_variant-${variant}`]" data-testid="icon">
    <component v-if="symbol" :is="symbol" viewBox="0 0 24 24"></component>
  </div>
</template>
```

```ts
// icon.ts

import { iconNames, iconStyles, iconWeights } from "alma-icons";

import type { UIElementVariant } from "@/typings";

export type IconName = (typeof iconNames)[number];

export type IconStyle = (typeof iconStyles)[number];

export type IconWeight = (typeof iconWeights)[number];

export interface IconProps {
  variant?: UIElementVariant;
  name: IconName;
  style: IconStyle;
  weight: IconWeight;
}

export * from "alma-icons";
```

### TypeScript types

AlmaIcons provides strict type support:

```ts
import type { IconName, IconStyle, IconWeight } from "alma-icons";

const name: IconName = "check";
const style: IconStyle = "fill";
const weight: IconWeight = "400";
```

_This enables autocomplete and prevents invalid icon usage._

## Development

To regenerate manifest after adding new icons:

```bash
pnpm generate
```

This updates `index.js` and `index.d.ts` with all available icons, names, styles, and weights.

## License

AlmaIcons © 2025 (Misha Grebennikov)[https://github.com/yamogoo]

Licensed under the (CC BY-NC 4.0)[https://creativecommons.org/licenses/by-nc/4.0/]
.

- You must give appropriate credit, provide a link to the license, and indicate if changes were made.

- **You may not use the icons for commercial purposes.**
