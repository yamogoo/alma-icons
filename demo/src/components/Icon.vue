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
  <div class="icon" data-testid="icon">
    <component v-if="symbol" :is="symbol" viewBox="0 0 24 24"></component>
  </div>
</template>

<style lang="scss">
@use "sass:map";

.icon {
  @include box(auto, inherit);
  line-height: 0;
  fill: inherit;

  svg {
    @include box(auto, inherit);
    fill: inherit;
    @extend %base-transition;

    path {
      fill: inherit;
      @extend %base-transition;
    }
  }

  .skeleton {
    @include box(100%);
  }
}
</style>
