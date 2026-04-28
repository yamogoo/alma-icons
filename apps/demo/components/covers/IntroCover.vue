<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  type ComputedRef,
  computed,
  type CSSProperties,
} from "vue";
import { storeToRefs } from "pinia";

import { useLocaleStore } from "@/stores/locale";

import AlmaIcon from "@/components/icons/AlmaIcon.vue";

import GProvider from "@/components/transition/GProvider.vue";
import ControlsHeader from "../container/ControlsHeader.vue";
import type { AlmaIconProps } from "alma-icons/vue";

const props = defineProps<Props>();

const { $t } = storeToRefs(useLocaleStore());

const { imagePath } = props;

const isMounted = ref(false);

const computedStyle: ComputedRef<CSSProperties> = computed(() => {
  return imagePath
    ? {
        backgroundImage: `url(${imagePath})`,
        backgroundPosition: "center",
        backgroundSize: "cover",
      }
    : {};
});

onMounted(() => {
  isMounted.value = true;
});

onUnmounted(() => {
  isMounted.value = false;
});

const icons: Array<Array<AlmaIconProps>> = [
  [
    { name: "music", weight: "200" },
    { name: "musicOff", weight: "200" },
    { name: "micDetailed", weight: "200" },
    { name: "micDisabledDetailed", weight: "200" },
    { name: "basketball", weight: "200" },
    { name: "football", weight: "200" },
    { name: "tennis", weight: "200" },
  ],
  [
    { name: "music", weight: "300" },
    { name: "musicOff", weight: "300" },
    { name: "micDetailed", weight: "300" },
    { name: "micDisabledDetailed", weight: "300" },
    { name: "basketball", weight: "300" },
    { name: "football", weight: "300" },
    { name: "tennis", weight: "300" },
  ],
  [
    { name: "music", weight: "400" },
    { name: "musicOff", weight: "400" },
    { name: "micDetailed", weight: "400" },
    { name: "micDisabledDetailed", weight: "400" },
    { name: "basketball", weight: "400" },
    { name: "football", weight: "400" },
    { name: "tennis", weight: "400" },
  ],
];
</script>

<script lang="ts">
export interface Props {
  title?: string;
  description?: string;
  imagePath?: string;
  isLogosShown?: boolean;
}
</script>

<template>
  <div class="ui-main-intro" :style="computedStyle">
    <ControlsHeader class="ui-main-intro__controls">
      <slot name="controls"></slot>
    </ControlsHeader>

    <div class="ui-main-intro__body">
      <div class="ui-main-intro__icons">
        <div
          v-for="(group, idx) in icons"
          :key="idx"
          class="ui-main-intro__icons-group"
        >
          <AlmaIcon
            v-for="(icon, iconIdx) in group"
            :key="iconIdx"
            :name="icon.name"
            :weight="icon.weight"
            tone="secondary"
          ></AlmaIcon>
        </div>
      </div>
      <div class="ui-main-intro__body-content">
        <GProvider
          :show="isMounted"
          :before-enter="{ opacity: 0, scale: 1.25 }"
          :enter="{
            opacity: 1,
            scale: 1,
            ease: 'power4.out',
            duration: 0.5,
            delay: 0.75,
          }"
        >
          <p v-if="description" class="ui-main-intro__description">
            {{ description }}
          </p>
        </GProvider>
      </div>
    </div>

    <div v-if="false" class="ui-main-intro__footer">
      <div class="ui-main-intro__info-container">
        <p class="ui-main-intro__info-descriptor">
          {{ $t["intro-cover"].description }}
        </p>
        <!-- <div class="ui-main-intro__info-event-icons">
          <Icon
            data-testid="mouse-icon"
            :name="'computerMouse_fill_200'"
            :size="'md'"
            alt="mouse events"
          />
          <Icon
            data-testid="touch-icon"
            :name="'gestureTap_fill_200'"
            :size="'md'"
            alt="touch events"
          />
        </div> -->
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";

.ui-main-intro {
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;

  & {
    @include box(100%);

    @include respond-above(lg) {
      padding: px2rem(
        map.get(
          map.get(map.get(map.get($layout, "cover"), "respond"), "desktop"),
          "padding"
        )
      );
    }

    @include respond-between(md, lg) {
      padding: px2rem(
        map.get(
          map.get(map.get(map.get($layout, "cover"), "respond"), "tablet"),
          "padding"
        )
      );
    }

    @include respond-below(md) {
      padding: px2rem(
        map.get(
          map.get(map.get(map.get($layout, "cover"), "respond"), "mobile"),
          "padding"
        )
      );
    }
  }

  &__icons {
    display: flex;
    flex-direction: column;
    gap: px2rem(map.get($gap, "lg"));
    width: 100%;
    max-width: 960px;

    &-group {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
    }
  }

  &__body {
    display: flex;
    @include flex-col(center);
    align-items: center;
    justify-content: center;
    gap: px2rem(map.get($gap, "lg"));
    @include box(100%, auto);

    margin: auto;

    &-content {
      min-width: px2rem(map.get(map.get($layout, "info"), "minContentWidth"));
      max-width: px2rem(map.get(map.get($layout, "info"), "maxContentWidth"));
    }
  }

  &__footer {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    flex-direction: row-reverse;
    gap: map.get($gap, "xs");
    @include padding(left right, px2rem(map.get($spacing, "lg")));
    @include padding(top bottom, px2rem(map.get($spacing, "lg")));
  }

  &__description {
    @extend %t__body__1;
    text-align: center;

    @include themify($themes) {
      color: themed("label", "secondary");
    }
    @extend %base-transition;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;

    &-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: px2rem(map.get(map.get($layout, "info"), "minContentWidth"));
      max-width: px2rem(map.get(map.get($layout, "info"), "maxContentWidth"));
      padding-bottom: px2rem(map.get($spacing, "lg"));
    }

    &-descriptor {
      @extend %t__body__2;
      text-align: center;

      @include themify($themes) {
        color: themed("label", "inactive");
      }
      @extend %base-transition;
    }

    &-event-icons {
      display: flex;
      gap: px2rem(map.get($gap, "xl"));
      width: min-content;
      @include themify($themes) {
        color: themed("image", "watermark");
      }
      @extend %base-transition;
    }
  }

  &__controls {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    justify-content: space-between;
  }
}
</style>
