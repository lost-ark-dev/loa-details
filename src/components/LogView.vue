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
          <span style="font-weight: bolder">
            <AbbreviatedNumberTemplate :val="totalDamageDealt" :hover="true" />
          </span>
        </span>
        <span style="margin-right: 12px">
          Total DPS
          <span style="font-weight: bolder">
            <AbbreviatedNumberTemplate
              :val="totalDamageDealt / (logData.duration / 1000)"
              :hover="true"
            />
          </span>
        </span>
        <span style="margin-right: 12px">
          Total TNK
          <span style="font-weight: bolder">
            <AbbreviatedNumberTemplate
              :val="logData.damageStatistics.totalDamageTaken"
              :hover="true"
            />
          </span>
        </span>
        <span v-if="isTakingScreenshot" class="watermark-box">
          <img class="watermark-logo" :src="logoImg" />
          github.com/lost-ark-dev/loa-details
        </span>
      </div>
    </div>

    <div v-if="!isTakingScreenshot">
      <q-btn flat size="sm" @click="damageType = 'dmg'"> DMG </q-btn>
      <q-btn flat size="sm" @click="damageType = 'rdps'"> rDPS </q-btn>
      <q-btn flat size="sm" @click="damageType = 'tank'"> TANK </q-btn>
      <q-btn flat size="sm" @click="damageType = 'shield_given'">
        SHIELD D
      </q-btn>
      <q-btn flat size="sm" @click="damageType = 'shield_gotten'">
        SHIELD G
      </q-btn>
      <q-btn flat size="sm" @click="damageType = 'eshield_given'">
        ESHIELD D
      </q-btn>
      <q-btn flat size="sm" @click="damageType = 'eshield_gotten'">
        ESHIELD G
      </q-btn>
      <template
        v-if="settingsStore.settings.damageMeter.tabs.dPartyBuff.enabled"
      >
        <q-btn
          flat
          size="sm"
          @click="damageType = 'party_buff_dmg'"
          label="PARTY BUFF DMG"
        />
      </template>
      <template
        v-if="settingsStore.settings.damageMeter.tabs.dSelfBuff.enabled"
      >
        <q-btn
          flat
          size="sm"
          @click="damageType = 'self_buff_dmg'"
          label="SELF BUFF DMG"
        />
      </template>
      <template
        v-if="settingsStore.settings.damageMeter.tabs.dOtherBuff.enabled"
      >
        <q-btn
          flat
          size="sm"
          @click="damageType = 'other_buff_dmg'"
          label="OTHER BUFF DMG"
        />
      </template>
      <template
        v-if="settingsStore.settings.damageMeter.tabs.hPartyBuff.enabled"
      >
        <q-btn
          flat
          size="sm"
          @click="damageType = 'party_buff_hit'"
          label="PARTY BUFF HIT"
        />
      </template>
      <template
        v-if="settingsStore.settings.damageMeter.tabs.hSelfBuff.enabled"
      >
        <q-btn
          flat
          size="sm"
          @click="damageType = 'self_buff_hit'"
          label="SELF BUFF HIT"
        />
      </template>
      <template
        v-if="settingsStore.settings.damageMeter.tabs.hOtherBuff.enabled"
      >
        <q-btn
          flat
          size="sm"
          @click="damageType = 'other_buff_hit'"
          label="OTHER BUFF HIT"
        />
      </template>
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

<script setup lang="ts">
import { ref, computed, PropType, type Ref } from "vue";
import { millisToMinutesAndSeconds } from "src/util/number-helpers";
import { Notify } from "quasar";
import { sleep } from "src/util/sleep";
import html2canvas from "html2canvas";

import DamageMeterTable from "src/components/DamageMeter/DamageMeterTable.vue";
import { useSettingsStore } from "src/stores/settings";
import { GameStateFile } from "src-electron/log-parser/file-parser";
import { DamageType } from "src/util/helpers";
import AbbreviatedNumberTemplate from "./DamageMeter/AbbreviatedNumberTemplate.vue";

const logoImg = new URL("../assets/images/logo.png", import.meta.url).href;

const settingsStore = useSettingsStore();

const props = defineProps({
  logData: {
    type: Object as PropType<GameStateFile>,
    required: true,
  },
});

defineExpose({
  takeScreenshot,
});

const damageType: Ref<DamageType> = ref("dmg");

const isTakingScreenshot = ref(false);
const hideNamesOnScreenshot = ref(false);

const totalDamageDealt = computed(() => {
  let totalDamageDealt = props.logData.damageStatistics.totalDamageDealt;
  if (
    settingsStore.settings.damageMeter.functionality.displayEsther &&
    settingsStore.settings.damageMeter.functionality.estherIncludeInTotal
  ) {
    props.logData.entities.forEach((e) => {
      if (e.isEsther) totalDamageDealt += e.damageInfo.damageDealt;
    });
  }
  return totalDamageDealt;
});

async function takeScreenshot(hideNames = true) {
  hideNamesOnScreenshot.value = hideNames;
  isTakingScreenshot.value = true;
  await sleep(600);

  /* eslint-disable */
  // @ts-ignore
  const screenshot = await html2canvas(this.$refs.logView, {
    backgroundColor: "#121212",
  });
  /* eslint-enable */
  screenshot.toBlob(
    (blob) => {
      if (blob)
        void navigator.clipboard.write([
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
