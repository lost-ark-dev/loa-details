<template>
  <template
    v-if="['classskill', 'identity'].includes(buff?.buffcategory ?? '')"
  >
    <q-tooltip
      class="buff-head-tooltip"
      anchor="top middle"
      self="bottom middle"
      >{{ getClassName(buff?.source.skill?.classid) }}:
      <img :src="getIconPath(buff?.source.skill?.icon)" />
      {{ buff?.source.skill?.name }} (
      <img :src="getIconPath(buff?.source.icon)" /> {{ buff?.source.name }}:
      <span v-html="buff?.source.desc"></span>)
    </q-tooltip>
  </template>
  <template v-else>
    <q-tooltip
      class="buff-head-tooltip"
      anchor="top middle"
      self="bottom middle"
    >
      <img :src="getIconPath(buff?.source.icon)" /> {{ buff?.source.name }}:
      <span v-html="buff?.source.desc"></span>
    </q-tooltip>
  </template>
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { QTooltip } from "quasar";
import { StatusEffect } from "meter-core/logger/data";
import { getIconPath, getClassName } from "../../util/helpers";

const props = defineProps({
  buffId: Number,
  buff: Object as PropType<StatusEffect>,
});
</script>

<style>
.buff-head-tooltip {
  position: relative;
  background: #121519;
  font-size: 14px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
}
.buff-head-tooltip img {
  width: 16px;
}
</style>
