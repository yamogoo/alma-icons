interface CodeBlock {
  lang: string;
  code: string;
  fileName?: string;
}

const vue3: Array<CodeBlock> = [
  {
    lang: "html",
    code: `<!-- Static mode -->
<script setup lang="ts">
import { SearchOutline400 } from "alma-icons/vue/icons";
</script>

<template>
  <SearchOutline400
    :size="20"
    title="Search"
    :decorative="false"
  />
</template>

<!-- Dynamic mode -->
<script setup lang="ts">
import { AlmaIcon } from "alma-icons/vue";
</script>

<template>
  <AlmaIcon
    name="search"
    appearance="outline"
    weight="400"
    :size="20"
  />
</template>`,
    fileName: "App.vue",
  },
];

const react: Array<CodeBlock> = [
  {
    lang: "ts",
    code: `/* * * Static mode * * */
import { SearchOutline400 } from "alma-icons/react/icons";

export function SearchButton() {
  return <SearchOutline400 size={20} title="Search" decorative={false} />;
}

/* * * Dynamic mode * * */
import { AlmaIcon } from "alma-icons/react";

export function Preview() {
  return <AlmaIcon name="search" appearance="outline" weight="400" size={20} />;
}`,
    fileName: "App.tsx",
  },
];

export const __DOC__: Record<
  "setup" | "install" | "usage" | string,
  Array<CodeBlock>
> = {
  vue3,
  react,
};
