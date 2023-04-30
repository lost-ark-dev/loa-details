<template>
  <tr v-if="player !== undefined && player.skills.size > 1">
    <td class="td-class-img">
      <img :src="getClassImage(player.classId)" />
    </td>
    <td class="ellipsis">
      <span>{{ entryName }}</span>
    </td>
    <td
      v-if="
        settingsStore.damageMeter.tabs.deathTime &&
        ['dmg', 'tank', 'heal', 'shield_given', 'shield_gotten', 'eshield_given', 'eshield_gotten'].includes(damageType)
      "
      class="text-center"
    >
      {{ deathTime }}
    </td>
    <td v-if="settingsStore.damageMeter.tabs.damage" class="text-center">
      {{ abbreviatedDamage[0] }}
      <span class="ex">
        {{ abbreviatedDamage[1] }}
      </span>
      <q-tooltip class="dmg_full_value" anchor="top middle" self="bottom middle">{{ abbreviatedDamage[2] }}</q-tooltip>
    </td>
    <template
      v-if="
        ['dmg', 'tank', 'heal', 'shield_given', 'shield_gotten', 'eshield_given', 'eshield_gotten'].includes(damageType)
      "
    >
      <td v-if="settingsStore.damageMeter.tabs.damagePercent" class="text-center">
        {{
          damageType === "dmg"
            ? player.damagePercentageTotal
            : damageType === "tank"
            ? player.tankPercentageTotal
            : damageType === "heal"
            ? player.healPercentageTotal
            : damageType === "shield_given"
            ? player.shieldGivenPercentageTotal
            : damageType === "shield_gotten"
            ? player.shieldGottenPercentageTotal
            : damageType == "eshield_given"
            ? player.eshieldGivenPercentageTotal
            : damageType == "eshield_gotten"
            ? player.eshieldGottenPercentageTotal
            : 0
        }}
        <span class="ex">%</span>
      </td>
      <td v-if="settingsStore.damageMeter.tabs.dps" class="text-center">
        {{ DPS[0] }}
        <span class="ex">
          {{ DPS[1] }}
        </span>
        <q-tooltip class="dmg_full_value" anchor="top middle" self="bottom middle">{{ DPS[2] }}</q-tooltip>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.critRate" class="text-center">
        {{ ((player.hits.crit / player.hits.total) * 100).toFixed(1) }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.faRate" class="text-center">
        <template v-if="player.hits.totalFrontAttack > 0">
          {{ ((player.hits.frontAttack / player.hits.totalFrontAttack) * 100).toFixed(1) }}
          <span class="ex">%</span>
        </template>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.baRate" class="text-center">
        <template v-if="player.hits.totalBackAttack > 0">
          {{ ((player.hits.backAttack / player.hits.totalBackAttack) * 100).toFixed(1) }}
          <span class="ex">%</span>
        </template>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.hBuffedBySup" class="text-center">
        {{ ((player.hits.hitsBuffedBySupport / player.hits.total) * 100).toFixed(1) }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.hDebuffedBySup" class="text-center">
        {{ ((player.hits.hitsDebuffedBySupport / player.hits.total) * 100).toFixed(1) }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.dBuffedBySup" class="text-center">
        {{ ((player.damageDealtBuffedBySupport / player.damageDealt) * 100).toFixed(1) }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.dDebuffedBySup" class="text-center">
        {{ ((player.damageDealtDebuffedBySupport / player.damageDealt) * 100).toFixed(1) }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && settingsStore.damageMeter.tabs.counterCount" class="text-center">
        {{ player.hits.counter }}
      </td>
      <template v-if="damageType === 'shield_given'">
        <td
          v-for="columnData of sortedAppliedShieldingBuffs"
          :key="columnData[0]"
          style="width: 90px; text-align: center"
        >
          {{ player.shieldDoneBy.get(columnData[0]) ?? 0 }}
        </td>
      </template>
      <template v-if="damageType === 'shield_gotten'">
        <td
          v-for="columnData of sortedAppliedShieldingBuffs"
          :key="columnData[0]"
          style="width: 90px; text-align: center"
        >
          {{ player.shieldReceivedBy.get(columnData[0]) ?? 0 }}
        </td>
      </template>
      <template v-if="damageType === 'eshield_given'">
        <td
          v-for="columnData of sortedEffectiveShieldingBuffs"
          :key="columnData[0]"
          style="width: 90px; text-align: center"
        >
          {{ player.damagePreventedWithShieldOnOthersBy.get(columnData[0]) ?? 0 }}
        </td>
      </template>
      <template v-if="damageType === 'eshield_gotten'">
        <td
          v-for="columnData of sortedEffectiveShieldingBuffs"
          :key="columnData[0]"
          style="width: 90px; text-align: center"
        >
          {{ player.damagePreventedByShieldBy.get(columnData[0]) ?? 0 }}
        </td>
      </template>
    </template>
    <template
      v-else-if="
        [
          'party_buff_dmg',
          'self_buff_dmg',
          'other_buff_dmg',
          'party_buff_hit',
          'self_buff_hit',
          'other_buff_hit',
        ].includes(damageType)
      "
    >
      <template
        v-if="
          (damageType === 'party_buff_dmg' && settingsStore.damageMeter.tabs.dPartyBuff) ||
          (damageType === 'party_buff_hit' && settingsStore.damageMeter.tabs.hPartyBuff) ||
          (damageType === 'self_buff_dmg' && settingsStore.damageMeter.tabs.dSelfBuff) ||
          (damageType === 'self_buff_hit' && settingsStore.damageMeter.tabs.hSelfBuff) ||
          (damageType === 'other_buff_dmg' && settingsStore.damageMeter.tabs.dOtherBuff) ||
          (damageType === 'other_buff_hit' && settingsStore.damageMeter.tabs.hOtherBuff)
        "
      >
        <td v-for="[columnKey, columnData] of sortedBuffs" :key="columnKey" style="width: 90px; text-align: center">
          <BuffTableBodyEntry
            :buffEntry="getBuffPercent(player, damageType, columnData)"
            :entry-data="player"
            :buffData="columnData"
          />
        </td>
      </template>
    </template>
    <!--
    <template v-else-if="['buff_dmg', 'buff_hit'].includes(damageType)">
      <template
        v-if="
          sessionState.damageStatistics &&
          (settingsStore.damageMeter.tabs.dDebuffed.enabled ||
            settingsStore.damageMeter.tabs.hDebuffed.enabled)
        "
      >
        <td
          v-for="statusEffecdId in sessionState.damageStatistics.debuffs"
          :key="statusEffecdId"
          style="text-align: center"
        >
          <template
            v-if="
              settingsStore.damageMeter.tabs.dDebuffed.enabled &&
              damageType === 'buff_dmg'
            "
          >
            {{
              player.damageDealtDebuffedBy.has(statusEffecdId)
                ? (
                    (player.damageDealtDebuffedBy.get(statusEffecdId) /
                      player.damageDealt) *
                    100
                  ).toFixed(1)
                : 0
            }}
            <span class="ex">% </span>
          </template>
          <template
            v-if="
              settingsStore.damageMeter.tabs.hDebuffed.enabled &&
              damageType === 'buff_hit'
            "
          >
            {{
              player.hits.hitsDebuffedBy.has(statusEffecdId)
                ? (
                    (player.hits.hitsDebuffedBy.get(statusEffecdId) /
                      player.hits.total) *
                    100
                  ).toFixed(1)
                : 0
            }}
            <span class="ex">%</span>
          </template>
        </td>
      </template>
      <template
        v-if="
          sessionState.damageStatistics &&
          (settingsStore.damageMeter.tabs.dBuffed.enabled ||
            settingsStore.damageMeter.tabs.hBuffed.enabled)
        "
      >
        <td
          v-for="statusEffecdId in sessionState.damageStatistics.buffs"
          :key="statusEffecdId"
          style="text-align: center"
        >
          <template
            v-if="
              settingsStore.damageMeter.tabs.dBuffed.enabled &&
              damageType === 'buff_dmg'
            "
          >
            {{
              player.damageDealtBuffedBy.has(statusEffecdId)
                ? (
                    (player.damageDealtBuffedBy.get(statusEffecdId) /
                      player.damageDealt) *
                    100
                  ).toFixed(1)
                : 0
            }}
            <span class="ex">% </span>
          </template>
          <template
            v-if="
              settingsStore.damageMeter.tabs.hBuffed.enabled &&
              damageType === 'buff_hit'
            "
          >
            {{
              player.hits.hitsBuffedBy.has(statusEffecdId)
                ? (
                    (player.hits.hitsBuffedBy.get(statusEffecdId) /
                      player.hits.total) *
                    100
                  ).toFixed(1)
                : 0
            }}
            <span class="ex">%</span>
          </template>
        </td>
      </template>
    </template>
    -->
    <div
      class="player-bar"
      :style="`
              width: ${
                damageType === 'tank'
                  ? player.tankPercentageTop
                  : damageType === 'heal'
                  ? player.healPercentageTop
                  : damageType === 'shield_given'
                  ? player.shieldGivenPercentageTop
                  : damageType === 'shield_gotten'
                  ? player.shieldGottenPercentageTop
                  : damageType === 'eshield_given'
                  ? player.eshieldGivenPercentageTop
                  : damageType === 'eshield_gotten'
                  ? player.eshieldGottenPercentageTop
                  : player.damagePercentageTop
              }%;
              background:${settingsStore.getClassColor(getClassName(player.classId))};
              `"
    >
      <!-- Player percentage bar -->
    </div>
  </tr>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { abbreviateNumber } from "src/util/number-helpers";
import { useSettingsStore } from "src/stores/settings";
import { GameState, StatusEffect } from "meter-core/logger/data";
import BuffTableBodyEntry from "./BuffTableBodyEntry.vue";
import { EntityExtended, getBuffPercent, getClassName } from "../../util/helpers";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import PCData from "/meter-data/databases/PCData.json";

const settingsStore = useSettingsStore();
const props = defineProps({
  player: { type: Object as PropType<EntityExtended> },
  sortedBuffs: { type: Map<string, Map<number, StatusEffect>>, required: true },
  sortedAppliedShieldingBuffs: {
    type: Map<number, StatusEffect>,
    required: true,
  },
  sortedEffectiveShieldingBuffs: {
    type: Map<number, StatusEffect>,
    required: true,
  },
  damageType: { type: String, default: "dmg" },
  fightDuration: { type: Number, required: true },
  lastCombatPacket: { type: Number, required: true },
  nameDisplay: { type: String, required: true },
  sessionState: { type: Object as PropType<GameState>, required: true },
});

const entryName = computed(() => {
  let res = "";
  if (!props.player) return res;
  if (props.player.isDead) {
    res += "💀 ";
  }

  let hasName = false;
  if (props.nameDisplay.includes("name")) {
    hasName = true;
    res += props.player.name + " ";
  }

  if (props.nameDisplay.includes("gear") || props.nameDisplay.includes("class")) {
    if (hasName) res += "(";

    let hasGearScore = false;
    if (props.nameDisplay.includes("gear") && props.player.gearScore && props.player.gearScore != 0) {
      res += props.player.gearScore;
      hasGearScore = true;
    }

    if (props.nameDisplay.includes("class")) {
      if (hasGearScore) {
        res += " ";
      }

      res += getClassName(props.player.classId);
    }

    if (hasName) res += ")";
  }

  return res;
});

const abbreviatedDamage = computed(() => {
  if (!props.player) return "";
  let damage = props.player.damageDealt;
  if (props.damageType === "tank") damage = props.player.damageTaken;
  else if (props.damageType === "heal") damage = props.player.healingDone;
  else if (props.damageType === "shield_given") damage = props.player.shieldDone;
  else if (props.damageType === "shield_gotten") damage = props.player.shieldReceived;
  else if (props.damageType === "eshield_given") damage = props.player.damagePreventedWithShieldOnOthers;
  else if (props.damageType === "eshield_gotten") damage = props.player.damagePreventedByShield;

  return abbreviateNumber(damage);
});

const DPS = computed(() => {
  if (!props.player) return "";
  let a = props.player.damageDealt;
  if (props.damageType === "tank") a = props.player.damageTaken;
  else if (props.damageType === "heal") a = props.player.healingDone;
  else if (props.damageType === "shield_given") a = props.player.shieldDone;
  else if (props.damageType === "shield_gotten") a = props.player.shieldReceived;
  else if (props.damageType === "eshield_given") a = props.player.damagePreventedWithShieldOnOthers;
  else if (props.damageType === "eshield_gotten") a = props.player.damagePreventedByShield;
  return abbreviateNumber(a / (props.fightDuration / 1000)); //return abbreviateNumber((a / (props.fightDuration / 1000)).toFixed(0));
});

const deathTime = computed(() => {
  if (!props.player) return "";
  if (props.player.isDead) {
    const curDate = props.lastCombatPacket;
    return ((curDate - props.player.deathTime) / 1000).toFixed(0) + "s";
  }
  return "";
});

function getClassImage(classId: number) {
  if (classId in PCData) return new URL(`../../assets/images/classes/${classId}.png`, import.meta.url).href;

  return new URL("../../assets/images/classes/101.png", import.meta.url).href;
}
</script>
