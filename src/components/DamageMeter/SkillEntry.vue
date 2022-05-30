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
    <td class="text-center">
      {{ maxDamage[0] }}
      <span class="ex">
        {{ maxDamage[1] }}
      </span>
    </td>
    <td class="text-center">
      {{ avgDamage[0] }}
      <span class="ex">
        {{ avgDamage[1] }}
      </span>
    </td>
    <td class="text-center">
      {{ skill.hits.total }}
    </td>
    <div
      class="player-bar"
      :style="`
              width:${skill.relativePercent}%;
              background:${settingsStore.getClassColor(className)};
              `"
    ></div>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { skills } from "src/constants/skills.js";
import { abbreviateNumber } from "src/util/number-helpers.js";
import { useSettingsStore } from "src/stores/settings";

const settingsStore = useSettingsStore();

const props = defineProps({
  skill: Object,
  className: String,
  fightDuration: Number,
});

const abbreviatedDamage = computed(() => {
  return abbreviateNumber(props.skill.totalDamage);
});

const DPS = computed(() => {
  return abbreviateNumber(
    (props.skill.totalDamage / (props.fightDuration / 1000)).toFixed(0)
  );
});

const maxDamage = computed(() => {
  return abbreviateNumber(props.skill.maxDamage);
});

const avgDamage = computed(() => {
  if (props.skill.hits.total === 0)
    return abbreviateNumber(props.skill.totalDamage);
  return abbreviateNumber(props.skill.totalDamage / props.skill.hits.total);
});

function getSkillImage(name) {
  const s = skills.find((k) => k.name == name);

  if (s != null) {
    if (s.name === "Bleed") s.id = 0;

    return new URL(
      `../../assets/images/skills/${s.id}_${s.name.replace(":", "-")}.png`,
      import.meta.url
    ).href;
  }

  return new URL(`../../assets/images/skills/unknown.png`, import.meta.url)
    .href;
}
</script>
