<template>
  <tr v-if="player !== undefined && player.skills.size > 1">
    <td class="td-class-img">
      <img :src="getClassImage(player.class)" />
    </td>
    <td class="ellipsis">
      <span>{{ entryName }}</span>
    </td>
    <td
      v-if="
        settingsStore.settings.damageMeter.tabs.deathTime.enabled &&
        ['dmg', 'tank', 'heal', 'shield'].includes(damageType)
      "
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
      <q-tooltip
        class="dmg_full_value"
        anchor="top middle"
        self="bottom middle"
        >{{ abbreviatedDamage[2] }}</q-tooltip
      >
    </td>
    <template v-if="['dmg', 'tank', 'heal', 'shield'].includes(damageType)">
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
        <q-tooltip
          class="dmg_full_value"
          anchor="top middle"
          self="bottom middle"
          >{{ DPS[2] }}</q-tooltip
        >
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
          (
            (player.hits.frontAttack / (player.hits.totalHitsWithFa ?? 0)) *
            100
          ).toFixed(1)
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
          (
            (player.hits.backAttack / (player.hits.totalHitsWithBa ?? 0)) *
            100
          ).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="
          damageType === 'dmg' &&
          settingsStore.settings.damageMeter.tabs.hBuffedBySup.enabled
        "
        class="text-center"
      >
        {{
          ((player.hits.hitsBuffedBySupport / player.hits.total) * 100).toFixed(
            1
          )
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="
          damageType === 'dmg' &&
          settingsStore.settings.damageMeter.tabs.hDebuffedBySup.enabled
        "
        class="text-center"
      >
        {{
          (
            (player.hits.hitsDebuffedBySupport / player.hits.total) *
            100
          ).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="
          damageType === 'dmg' &&
          settingsStore.settings.damageMeter.tabs.dBuffedBySup.enabled
        "
        class="text-center"
      >
        {{
          (
            (player.damageDealtBuffedBySupport / player.damageDealt) *
            100
          ).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="
          damageType === 'dmg' &&
          settingsStore.settings.damageMeter.tabs.dDebuffedBySup.enabled
        "
        class="text-center"
      >
        {{
          (
            (player.damageDealtDebuffedBySupport / player.damageDealt) *
            100
          ).toFixed(1)
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
          (damageType === 'party_buff_dmg' &&
            settingsStore.settings.damageMeter.tabs.dPartyBuff.enabled) ||
          (damageType === 'party_buff_hit' &&
            settingsStore.settings.damageMeter.tabs.hPartyBuff.enabled) ||
          (damageType === 'self_buff_dmg' &&
            settingsStore.settings.damageMeter.tabs.dSelfBuff.enabled) ||
          (damageType === 'self_buff_hit' &&
            settingsStore.settings.damageMeter.tabs.hSelfBuff.enabled) ||
          (damageType === 'other_buff_dmg' &&
            settingsStore.settings.damageMeter.tabs.dOtherBuff.enabled) ||
          (damageType === 'other_buff_hit' &&
            settingsStore.settings.damageMeter.tabs.dParhOtherBufftyBuff
              .enabled)
        "
      >
        <td
          v-for="[columnKey, columnData] of sortedBuffs"
          :key="columnKey"
          style="width: 90px; text-align: center"
        >
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
          (settingsStore.settings.damageMeter.tabs.dDebuffed.enabled ||
            settingsStore.settings.damageMeter.tabs.hDebuffed.enabled)
        "
      >
        <td
          v-for="statusEffecdId in sessionState.damageStatistics.debuffs"
          :key="statusEffecdId"
          style="text-align: center"
        >
          <template
            v-if="
              settingsStore.settings.damageMeter.tabs.dDebuffed.enabled &&
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
              settingsStore.settings.damageMeter.tabs.hDebuffed.enabled &&
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
          (settingsStore.settings.damageMeter.tabs.dBuffed.enabled ||
            settingsStore.settings.damageMeter.tabs.hBuffed.enabled)
        "
      >
        <td
          v-for="statusEffecdId in sessionState.damageStatistics.buffs"
          :key="statusEffecdId"
          style="text-align: center"
        >
          <template
            v-if="
              settingsStore.settings.damageMeter.tabs.dBuffed.enabled &&
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
              settingsStore.settings.damageMeter.tabs.hBuffed.enabled &&
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
                  : damageType === 'shield'
                  ? player.shieldPercentageTop
                  : player.damagePercentageTop
              }%;
              background:${settingsStore.getClassColor(player.class)};
              `"
    >
      <!-- Player percentage bar -->
    </div>
  </tr>
</template>

<script setup lang="ts">
import { computed, PropType, defineEmits } from "vue";
import { classes } from "src/constants/classes";
import { abbreviateNumber } from "src/util/number-helpers";
import { useSettingsStore } from "src/stores/settings";
import { Game, StatusEffect } from "loa-details-log-parser/data";
import BuffTableBodyEntry from "./BuffTableBodyEntry.vue";
import { EntityExtended, getBuffPercent } from "../../util/helpers";

const settingsStore = useSettingsStore();
const props = defineProps({
  player: { type: Object as PropType<EntityExtended> },
  sortedBuffs: { type: Map<string, Map<number, StatusEffect>>, required: true },
  damageType: { type: String, default: "dmg" },
  fightDuration: { type: Number, required: true },
  lastCombatPacket: { type: Number, required: true },
  nameDisplay: { type: String, required: true },
  sessionState: { type: Object as PropType<Game>, required: true },
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

  if (
    props.nameDisplay.includes("gear") ||
    props.nameDisplay.includes("class")
  ) {
    if (hasName) res += "(";

    let hasGearScore = false;
    if (
      props.nameDisplay.includes("gear") &&
      props.player.gearScore &&
      props.player.gearScore != 0
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
  if (!props.player) return "";
  let damage = props.player.damageDealt;
  if (props.damageType === "tank") damage = props.player.damageTaken;
  else if (props.damageType === "heal") damage = props.player.healingDone;
  else if (props.damageType === "shield") damage = props.player.shieldDone;

  return abbreviateNumber(damage);
});

const DPS = computed(() => {
  if (!props.player) return "";
  let a = props.player.damageDealt;
  if (props.damageType === "tank") a = props.player.damageTaken;
  else if (props.damageType === "heal") a = props.player.healingDone;
  else if (props.damageType === "shield") a = props.player.shieldDone;
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

function getClassImage(className: string) {
  if (className in classes)
    return new URL(
      `../../assets/images/classes/${className}.png`,
      import.meta.url
    ).href;

  return new URL("../../assets/images/classes/Warrior.png", import.meta.url)
    .href;
}
</script>
