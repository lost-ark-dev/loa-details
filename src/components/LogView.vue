<template>
  <div ref="logView" :style="isTakingScreenshot ? 'padding: 16px' : ''">
    <div class="info-box">
      <div class="flex" v-if="logData">
        <span style="margin-right: 12px">
          {{ logData.mostDamageTakenEntity.name }}
          ({{ millisToMinutesAndSeconds(logData.duration) }})
        </span>
        <span style="margin-right: 12px">
          Total DMG
          {{ numberFormat(logData.damageStatistics.totalDamageDealt) }}
        </span>
        <span style="margin-right: 12px">
          Total DPS
          {{
            numberFormat(
              (
                logData.damageStatistics.totalDamageDealt /
                (logData.duration / 1000)
              ).toFixed(0)
            )
          }}
        </span>
        <span style="margin-right: 12px">
          Total TNK
          {{ numberFormat(logData.damageStatistics.totalDamageTaken) }}
        </span>
        <span v-if="isTakingScreenshot" class="watermark-box">
          <img class="watermark-logo" :src="logoImg" />
          github.com/karaeren/loa-details
        </span>
      </div>
    </div>

    <div v-if="!isTakingScreenshot">
      <q-btn flat size="sm" @click="damageType = 'dmg'"> DMG </q-btn>
      <q-btn flat size="sm" @click="damageType = 'tank'"> TANK </q-btn>
      <q-btn flat size="sm" @click="damageType = 'heal'"> HEAL </q-btn>
      <q-btn flat size="sm" @click="damageType = 'shield'"> SHIELD </q-btn>
    </div>

    <DamageMeterTable
      v-if="logData"
      :session-state="logData"
      :damage-type="damageType"
      :duration="logData.duration"
      :name-display="
        isTakingScreenshot
          ? hideNamesOnScreenshot
            ? 'gear+class'
            : 'name+gear+class'
          : 'name+gear+class'
      "
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import {
  numberFormat,
  millisToMinutesAndSeconds,
} from "src/util/number-helpers";
import { Notify } from "quasar";
import { sleep } from "src/util/sleep";
import html2canvas from "html2canvas";

import DamageMeterTable from "src/components/DamageMeter/DamageMeterTable.vue";
import { useSettingsStore } from "src/stores/settings";

const logoImg = new URL(`../assets/images/logo.png`, import.meta.url).href;

const settingsStore = useSettingsStore();

const props = defineProps({
  logData: Object,
});

defineExpose({
  takeScreenshot,
});

const damageType = ref("dmg");

const isTakingScreenshot = ref(false);
const hideNamesOnScreenshot = ref(false);
async function takeScreenshot(hideNames = true) {
  hideNamesOnScreenshot.value = hideNames;
  isTakingScreenshot.value = true;
  await sleep(600);

  const logViewRef = this.$refs.logView;
  const screenshot = await html2canvas(logViewRef, {
    backgroundColor: "#121212",
  });

  screenshot.toBlob(
    (blob) => {
      navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    },
    "image/png",
    1
  );

  if (settingsStore.settings.general.saveScreenshots) {
    window.messageApi.send("window-to-main", {
      message: "save-screenshot",
      value: screenshot.toDataURL(),
    });
  }

  isTakingScreenshot.value = false;
  Notify.create({
    message: "<center>Screenshot copied to clipboard.</center>",
    color: "primary",
    html: true,
  });
}
</script>

<style>
.info-box {
  font-size: 11px;
  padding: 8px 0;
}
.watermark-box {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 4px;
}
.watermark-logo {
  width: 128px;
}
</style>
