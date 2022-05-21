<template>
  <tr>
    <td class="td-skill-img">
      <img :src="getSkillImage(skill.name)" />
    </td>
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
      {{ DPS[0] }}
      <span class="ex">
        {{ DPS[1] }}
      </span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.critRate.enabled"
      class="text-center"
    >
      {{
        skill.hits.total > 0
          ? ((skill.hits.crit / skill.hits.total) * 100).toFixed(1)
          : (0).toFixed(1)
      }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.faRate.enabled"
      class="text-center"
    >
      {{
        skill.hits.total > 0
          ? ((skill.hits.frontAttack / skill.hits.total) * 100).toFixed(1)
          : (0).toFixed(1)
      }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
      class="text-center"
    >
      {{
        skill.hits.total > 0
          ? ((skill.hits.backAttack / skill.hits.total) * 100).toFixed(1)
          : (0).toFixed(1)
      }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.counterCount.enabled"
      class="text-center"
    >
      {{ skill.hits.counter }}
    </td>
    <div
      class="player-bar"
      :style="`
              width:${skill.relativePercent}%;
              background:${getClassColor(className)};
              `"
    ></div>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { skills } from "../../constants/skills.js";
import { useSettingsStore } from "../../stores/settings";
const settingsStore = useSettingsStore();

const props = defineProps({
  skill: Object,
  className: String,
  fightDuration: Number,
});

const abbreviatedDamage = computed(() => {
  return abbreviateNumber(props.skill.totalDamage);
});

function getClassColor(className) {
  if (className in settingsStore.settings.damageMeter.classes)
    return settingsStore.settings.damageMeter.classes[className].color;
  return "#353535";
}

const DPS = computed(() => {
  return abbreviateNumber(
    (props.skill.totalDamage / (props.fightDuration / 1000)).toFixed(0)
  );
});

function abbreviateNumber(n) {
  if (n < 1e3) return [n, ""];
  if (n >= 1e3 && n < 1e6) return [+(n / 1e3).toFixed(1), "k"];
  if (n >= 1e6 && n < 1e9) return [+(n / 1e6).toFixed(1), "m"];
  if (n >= 1e9 && n < 1e12) return [+(n / 1e9).toFixed(1), "b"];
  if (n >= 1e12) return [+(n / 1e12).toFixed(1), "t"];
}

function getSkillImage(name) {
  const s = skills.find((k) => k.name == name);

  if (s != null) {
    return new URL(
      `../../assets/images/skills/${s.id}_${s.name.replace(":", "-")}.png`,
      import.meta.url
    ).href;
  }

  return new URL(`../../assets/images/skills/unknown.png`, import.meta.url)
    .href;
}
</script>
