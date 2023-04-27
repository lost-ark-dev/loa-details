<template>
  <template v-if="buffEntry.get(-1)">
    {{ buffEntry.get(-1)?.toFixed(1) }}
    <span class="ex">% </span>
  </template>
  <template v-if="buffEntry.size > 1">
    <q-tooltip
      class="buff-body-tooltip"
      anchor="top middle"
      self="bottom middle"
    >
      <template v-for="[buffId, buffValue] of buffEntry" :key="buffId">
        <template v-if="buffId !== -1 && buffValue">
          <div>
            <img
              class="header_img"
              :src="getIconPath(buffData.get(buffId)?.source.icon)"
            />
            <template v-if="buffData.get(buffId)?.source.skill"
              >(
              <img
                class="header_img"
                :src="getIconPath(buffData.get(buffId)?.source.skill?.icon)"
              />
              )
            </template>
            {{ buffValue?.toFixed(1) }}
            <span class="ex">% </span>
          </div>
        </template>
      </template>
    </q-tooltip></template
  >
</template>

<script setup lang="ts">
import { PropType } from "vue";
import { QTooltip } from "quasar";
import { StatusEffect } from "meter-core/logger/data";
import { getIconPath, EntryData } from "../../util/helpers";

const props = defineProps({
  buffEntry: { type: Map<number, number>, required: true },
  entryData: { type: Object as PropType<EntryData>, required: true },
  buffData: { type: Map<number, StatusEffect>, required: true },
});
</script>

<style>
.buff-body-tooltip {
  position: relative;
  background: #121519;
  font-size: 14px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
  align-items: center;
}
.buff-body-tooltip img {
  width: 20px;
  vertical-align: top;
}
</style>
