<script setup lang="ts">
import { Icon, iconNames, iconWeights } from "@/components";
</script>

<template>
  <div class="icons">
    <template v-for="(name, idx) in iconNames" :key="`${name}${idx}`">
      <template v-for="weight in iconWeights" :key="`${weight}`">
        <Icon
          :name="name"
          :weight="weight"
          :style="'outline'"
          :variant="'default'"
        ></Icon>
      </template>
    </template>
    <template v-for="(name, idx) in iconNames" :key="`${name}${idx}`">
      <template v-for="weight in iconWeights" :key="`${weight}`">
        <Icon
          :name="name"
          :weight="weight"
          :style="'fill'"
          :variant="'default'"
        ></Icon>
      </template>
    </template>
  </div>
</template>

<style lang="scss">
#app {
  @include box(100vw, 100dvh);
}

.icons {
  display: flex;
  flex-wrap: wrap;
  gap: px2rem(24px);
  @include box(100%);
  overflow-x: hidden;

  .icon {
    @include box(px2rem(24px));
  }
}
</style>
