<template>
  <tr>
    <td class="td-class-img">
      <img :src="getClassImage(player.class)" />
    </td>
    <td class="ellipsis">{{ player.name }} ({{ player.class }})</td>
    <td class="text-center">
      {{ abbreviatedDamage[0] }}
      <span class="ex">
        {{ abbreviatedDamage[1] }}
      </span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
      class="text-center"
    >
      {{
        showTanked ? player.tankPercentageTotal : player.damagePercentageTotal
      }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
      class="text-center"
    >
      {{ DPS[0] }}
      <span class="ex">
        {{ DPS[1] }}
      </span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.critRate.enabled"
      class="text-center"
    >
      {{ ((player.hits.crit / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.faRate.enabled"
      class="text-center"
    >
      {{ ((player.hits.frontAttack / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
      class="text-center"
    >
      {{ ((player.hits.backAttack / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.counterCount.enabled"
      class="text-center"
    >
      {{ player.hits.counter }}
    </td>
    <div
      class="player-bar"
      :style="`
              width:${
                showTanked
                  ? player.tankPercentageTop
                  : player.damagePercentageTop
              }%;
              background:${settingsStore.getClassColor(player.class)};
              `"
    >
      <!-- Player percentage bar -->
    </div>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { classes } from "src/constants/classes";
import { abbreviateNumber } from "src/util/number-helpers";
import { useSettingsStore } from "src/stores/settings";

const settingsStore = useSettingsStore();

const props = defineProps({
  player: Object,
  showTanked: Boolean,
  fightDuration: Number,
});

const abbreviatedDamage = computed(() => {
  return abbreviateNumber(
    props.showTanked ? props.player.damageTaken : props.player.damageDealt
  );
});

const DPS = computed(() => {
  let a = props.player.damageDealt;
  if (props.showTanked) a = props.player.damageTaken;
  return abbreviateNumber((a / (props.fightDuration / 1000)).toFixed(0));
});

function getClassImage(className) {
  if (className in classes)
    return new URL(
      `../../assets/images/classes/${className}.png`,
      import.meta.url
    ).href;

  return new URL(`../../assets/images/classes/Warrior.png`, import.meta.url)
    .href;
}
</script>
