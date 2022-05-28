<template>
  <div>
    <!-- Encounter selection -->
    <div class="info-box">
      <div v-if="logData">
        <span style="margin-right: 12px">
          Total DMG
          {{ numberFormat(logData.damageStatistics.totalDamageDealt) }}
        </span>
        <span style="margin-right: 12px">
          Total TNK
          {{ numberFormat(logData.damageStatistics.totalDamageTaken) }}
        </span>
      </div>
    </div>
    <DamageMeterTable
      v-if="logData"
      :session-state="logData"
      :damage-type="damageType"
      :duration="logData.duration"
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { numberFormat } from "src/util/number-helpers";

import DamageMeterTable from "src/components/DamageMeter/DamageMeterTable.vue";

const props = defineProps({
  logData: Object,
});

const damageType = ref("dmg"); // todo add tank button
</script>

<style>
.info-box {
  font-size: 11px;
  padding: 8px 0;
}
</style>
