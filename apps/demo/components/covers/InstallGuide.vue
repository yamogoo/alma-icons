<script setup lang="ts">
import BoxedLink from "@/components/controls/BoxedLink.vue";
import ControlsHeader from "@/components/container/ControlsHeader.vue";

withDefaults(defineProps<Props>(), {
  title: "Install",
  links: () => [
    { name: "pnpm add alma-icons" },
    { name: "yarn add alma-icons" },
    { name: "npm i alma-icons" },
  ],
});

const onCopy = (name: string | undefined): void => {
  if (name) navigator.clipboard.writeText(name);
};
</script>

<script lang="ts">
export interface LinkData {
  name: string;
  url?: string;
}

export interface Props {
  title?: string;
  links?: Array<LinkData>;
}
</script>

<template>
  <div class="ui-main-guide">
    <ControlsHeader class="ui-main-guide__controls">
      <slot name="controls"></slot>
    </ControlsHeader>
    <h3 class="ui-main-guide__title">
      {{ title }}
    </h3>
    <BoxedLink
      v-for="({ url, name }, idx) in links"
      :key="idx"
      data-testid="boxed-link"
      :src="url"
      @copy="onCopy(name)"
    >
      {{ name }}
    </BoxedLink>
  </div>
</template>

<style lang="scss">
@use "sass:map";

.ui {
  &-main-guide {
    display: flex;
    @include flex-col(center);
    @include box(100%);

    @include respond-above("md") {
      padding: px2rem(map.get($spacing, "xxl"));
    }

    @include respond-below("md") {
      padding: px2rem(map.get($spacing, "sm"));
    }

    .ui-main-guide__title {
      @extend %t__body__1;
      margin: 0;
      padding: 0;
      text-align: center;

      @include themify($themes) {
        color: themed("label", "primary");
      }
    }

    &__controls {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
    }

    .figma-link {
      margin-top: px2rem(map.get($spacing, xs));
    }
  }
}
</style>
