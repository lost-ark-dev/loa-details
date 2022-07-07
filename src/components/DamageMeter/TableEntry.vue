<template>
  <tr v-if="Object.keys(player.skills).length > 1">
    <td class="td-class-img">
      <img :src="getClassImage(player.class)" />
    </td>
    <td class="ellipsis">
      <span>{{ entryName }}</span>
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.deathTime.enabled"
      class="text-center"
    >
      {{ deathTime }}
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
      class="text-center"
    >
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
        damageType === "dmg"
          ? player.damagePercentageTotal
          : damageType === "tank"
          ? player.tankPercentageTotal
          : damageType === "heal"
          ? player.healPercentageTotal
          : damageType === "shield"
          ? player.shieldPercentageTotal
          : 0
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
      v-if="
        damageType === 'dmg' &&
        settingsStore.settings.damageMeter.tabs.critRate.enabled
      "
      class="text-center"
    >
      {{ ((player.hits.crit / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="
        damageType === 'dmg' &&
        settingsStore.settings.damageMeter.tabs.faRate.enabled
      "
      class="text-center"
    >
      {{
        ((player.hits.frontAttack / player.hits.totalHitsWithFa) * 100).toFixed(
          1
        )
      }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="
        damageType === 'dmg' &&
        settingsStore.settings.damageMeter.tabs.baRate.enabled
      "
      class="text-center"
    >
      {{
        ((player.hits.backAttack / player.hits.totalHitsWithBa) * 100).toFixed(
          1
        )
      }}
      <span class="ex">%</span>
    </td>
    <td
      v-if="
        damageType === 'dmg' &&
        settingsStore.settings.damageMeter.tabs.counterCount.enabled
      "
      class="text-center"
    >
      {{ player.hits.counter }}
    </td>
    <div
      class="player-bar"
      :style="`
              width: ${
                damageType === 'dmg'
                  ? player.damagePercentageTop
                  : damageType === 'tank'
                  ? player.tankPercentageTop
                  : damageType === 'heal'
                  ? player.healPercentageTop
                  : damageType === 'shield'
                  ? player.shieldPercentageTop
                  : 0
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
  damageType: { type: String, default: "dmg" },
  fightDuration: Number,
  lastCombatPacket: Number,
  nameDisplay: String,
});

const entryName = computed(() => {
  let res = "";

  if (props.player.isDead) {
    res += "💀 ";
  }

  let hasName = false;
  if (props.nameDisplay.includes("name")) {
    hasName = true;
    res += props.player.name + " ";
  }

  if (
    props.nameDisplay.includes("gear") ||
    props.nameDisplay.includes("class")
  ) {
    if (hasName) res += "(";

    let hasGearScore = false;
    if (
      props.nameDisplay.includes("gear") &&
      props.player.gearScore &&
      props.player.gearScore != "0"
    ) {
      res += props.player.gearScore;
      hasGearScore = true;
    }

    if (props.nameDisplay.includes("class")) {
      if (hasGearScore) {
        res += " ";
      }

      res += props.player.class;
    }

    if (hasName) res += ")";
  }

  return res;
});

const abbreviatedDamage = computed(() => {
  let damage = props.player.damageDealt;
  if (props.damageType === "tank") damage = props.player.damageTaken;
  else if (props.damageType === "heal") damage = props.player.healingDone;
  else if (props.damageType === "shield") damage = props.player.shieldDone;

  return abbreviateNumber(damage);
});

const DPS = computed(() => {
  let a = props.player.damageDealt;
  if (props.damageType === "tank") a = props.player.damageTaken;
  else if (props.damageType === "heal") a = props.player.healingDone;
  else if (props.damageType === "shield") a = props.player.shieldDone;

  return abbreviateNumber((a / (props.fightDuration / 1000)).toFixed(0));
});

const deathTime = computed(() => {
  if (props.player.isDead) {
    const curDate = props.lastCombatPacket;
    return ((curDate - props.player.deathTime) / 1000).toFixed(0) + "s";
  }
  return "";
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
