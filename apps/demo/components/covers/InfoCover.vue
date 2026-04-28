<script setup lang="ts">
import { computed, storeToRefs, useRuntimeConfig } from "#imports";

import { useLocaleStore } from "@/stores/locale";

import BaseLink from "@/components/controls/BaseLink.vue";
import type { SymbolName } from "@/components/icons/Icon.vue";

const runtimeConfig = useRuntimeConfig();

const { $t } = storeToRefs(useLocaleStore());

const figmaUrl = import.meta.env.VITE_FIGMA_URL;
const figmaPluginUrl = import.meta.env.VITE_FIGMA_PLUGIN_URL;

const authoGithubLInk = import.meta.env.VITE_AUTHOR_GITHUB_URL;
const githubLink = import.meta.env.VITE_MONOREPO_URL;
const webCatalogueLink = import.meta.env.VITE_WEB_CATALOGUE_URL;
const monorepoBlobUrl = import.meta.env.VITE_MONOREPO_BLOB_URL;

const assetLicenseUrl = import.meta.env.VITE_ASSETS_LICENSE_URL;

interface InfoLink {
  testId: string;
  iconName: SymbolName;
  name: string;
  to: string;
}

const infoLinks = computed<InfoLink[]>(() => [
  {
    testId: "web-catalogue-link",
    iconName: "localeKey_outline_200",
    name: $t.value["info-cover"].links.webCatalogue,
    to: webCatalogueLink,
  },
  {
    testId: "figma-library-link",
    iconName: "figma-logo",
    name: $t.value["info-cover"].links.figmaLibrary,
    to: figmaUrl,
  },
  {
    testId: "figma-plugin-link",
    iconName: "figma-logo",
    name: $t.value["info-cover"].links.figmaPlugin,
    to: figmaPluginUrl,
  },
  {
    testId: "github-link",
    iconName: "github-logo",
    name: $t.value["info-cover"].links.gitRepository,
    to: githubLink,
  },
]);
</script>

<template>
  <div class="ui-main-info">
    <div class="ui-main-info__body">
      <BaseLink
        v-for="{ testId, iconName, name, to } in infoLinks"
        :key="testId"
        class="ui-main-info__link"
        :data-testid="testId"
        :orientation="'horizontal'"
        :size="'lg'"
        :icon-name="iconName"
        :to="to"
        :target="'_blank'"
        :name="name"
        filled
      />
    </div>
    <div class="ui-main-info__footer">
      <p>
        {{ $t["info-cover"]["licensedBy"] }}
        <BaseLink
          data-testid="repo-link"
          :color="'accent'"
          :to="`${monorepoBlobUrl}v.${runtimeConfig.public.productVueVersion}/LICENSE`"
          :target="'_blank'"
        >
          MIT {{ $t["info-cover"]["license"] }}
        </BaseLink>
        <br />{{ $t["info-cover"]["assetLicense"] }}
        <BaseLink
          data-testid="repo-link"
          :color="'accent'"
          :to="assetLicenseUrl"
          :target="'_blank'"
        >
          {{ $t["info-cover"]["assetsLicenseName"] }}
          {{ $t["info-cover"]["license"] }}
        </BaseLink>
      </p>
      <p>
        {{ $t["info-cover"]["author"] }}:
        <BaseLink :color="'accent'" :to="authoGithubLInk" target="_blank">
          {{ $t["info-cover"]["author-name"] }}
        </BaseLink>
      </p>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:map";

.ui {
  &-main-info {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    justify-content: center;
    @include box(100%);

    &__body {
      display: grid;
      grid-template-columns: repeat(2, minmax(px2rem(220px), 1fr));
      align-items: center;
      align-content: center;
      justify-content: center;
      gap: px2rem(map.get($spacing, "xl")) px2rem(map.get($spacing, "xxl"));
      width: 100%;
      max-width: px2rem(700px);
      min-width: 0;
      margin: 0 auto;
      padding: px2rem(map.get($spacing, "xxl")) px2rem(map.get($spacing, "xl"))
        px2rem(map.get($spacing, "lg"));
    }

    &__link {
      width: 100%;
      justify-content: flex-start;
      min-width: 0;

      .ui-link__name {
        overflow-wrap: anywhere;
        word-break: normal;
        text-align: left;
      }
    }

    &__footer {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      @include respond-above(lg) {
        @include padding(
          left bottom right,
          px2rem(
            map.get(
              map.get(map.get(map.get($layout, "cover"), "respond"), "desktop"),
              "padding"
            )
          )
        );
      }

      @include respond-between(md, lg) {
        @include padding(
          left bottom right,
          px2rem(
            map.get(
              map.get(map.get(map.get($layout, "cover"), "respond"), "tablet"),
              "padding"
            )
          )
        );
      }

      @include respond-below(md) {
        @include padding(
          left bottom right,
          px2rem(
            map.get(
              map.get(map.get(map.get($layout, "cover"), "respond"), "mobile"),
              "padding"
            )
          )
        );
      }

      p {
        text-align: center;
        padding: 0;
        margin: 0;
        @extend %t__body__2;
        letter-spacing: 0;
        @include themify($themes) {
          color: themed("label", "disabled");
        }
      }
    }

    @include respond-below(md) {
      &__body {
        grid-template-columns: minmax(0, px2rem(280px));
        gap: px2rem(map.get($spacing, "lg"));
        padding: px2rem(map.get($spacing, "xl")) px2rem(map.get($spacing, "md"))
          px2rem(map.get($spacing, "lg"));
      }

      &__link {
        .ui-link__icon {
          @include box(px2rem(36px));
          @include minBox(px2rem(36px));

          svg {
            @include box(px2rem(36px));
          }
        }

        .ui-link__name {
          font-size: px2rem(16px);
        }
      }
    }
  }
}
</style>
