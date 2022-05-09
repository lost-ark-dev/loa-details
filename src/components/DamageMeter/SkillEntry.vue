<template>
  <tr>
    <td class="td-class-img"></td>
    <td class="ellipsis">{{ skill.name }}</td>
    <td class="text-center">
      {{ abbreviatedDamage[0] }}
      <span class="ex">
        {{ abbreviatedDamage[1] }}
      </span>
    </td>
    <td class="text-center">
      {{ skill.damagePercent }}<span class="ex">%</span>
    </td>
    <td class="text-center">
      {{ numberFormat(DPS) }}
    </td>
    <td class="text-center">
      {{ skill.useCount }}
    </td>
    <div
      class="player-bar"
      :style="`
              width:${skill.damagePercent}%;
              background:${getClassColor(className)};}
              `"
    ></div>
  </tr>
</template>

<script setup>
import { computed } from "vue";

import { useSettingsStore } from "../../stores/settings";
const settingsStore = useSettingsStore();

const props = defineProps({
  skill: Object,
  className: String,
  fightDuration: Number,
});

const DPS = computed(() => {
  return (props.skill.totalDamage / (props.fightDuration / 1000)).toFixed(0);
});

const abbreviatedDamage = computed(() => {
  return abbreviateNumber(props.skill.totalDamage);
});

function getClassColor(className) {
  if (className in settingsStore.settings.damageMeter.classes)
    return settingsStore.settings.damageMeter.classes[className].color;
  return "#353535";
}

function numberFormat(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function abbreviateNumber(n) {
  if (n < 1e3) return [n, ""];
  if (n >= 1e3 && n < 1e6) return [+(n / 1e3).toFixed(1), "k"];
  if (n >= 1e6 && n < 1e9) return [+(n / 1e6).toFixed(1), "m"];
  if (n >= 1e9 && n < 1e12) return [+(n / 1e9).toFixed(1), "b"];
  if (n >= 1e12) return [+(n / 1e12).toFixed(1), "t"];
}
</script>
