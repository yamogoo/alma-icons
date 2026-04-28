<script setup lang="ts">
import { AlmaIcon, type AlmaIconProps } from "alma-icons/vue";

type AlmaIconTone = "primary" | "secondary";

interface Props extends AlmaIconProps {
  tone?: AlmaIconTone;
}

const props = withDefaults(defineProps<Props>(), {
  appearance: "outline",
  weight: "300",
  tone: "primary",
  size: 24,
});
</script>

<template>
  <AlmaIcon v-bind="props" :class="[`alma-icon_tone-${tone}`]"></AlmaIcon>
</template>

<style lang="scss">
@mixin defineTheme($tones: primary secondary) {
  @each $tone in $tones {
    &_tone-#{$tone} {
      @include themify($themes) {
        color: themed("label", $tone);
      }
    }
  }
}
.alma-icon {
  @include defineTheme();
}
</style>
