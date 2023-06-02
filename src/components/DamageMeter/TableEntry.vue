<template>
  <tr v-if="player !== undefined">
    <td class="td-class-img">
      <img :src="getClassImage(player.classId, player.icon)" />
    </td>
    <td class="ellipsis">
      <span>{{ entryName }}</span>
    </td>
    <td
      v-if="
        settingsStore.settings.damageMeter.tabs.deathTime.enabled &&
        [
          'dmg',
          'rdps',
          'tank',
          'heal',
          'shield_given',
          'shield_gotten',
          'eshield_given',
          'eshield_gotten',
        ].includes(damageType)
      "
      class="text-center"
    >
      {{ deathTime }}
    </td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
      class="text-center"
    >
      <AbbreviatedNumberTemplate :val="DAMAGE" :hover="true" />
    </td>
    <template
      v-if="
        [
          'dmg',
          'rdps',
          'tank',
          'heal',
          'shield_given',
          'shield_gotten',
          'eshield_given',
          'eshield_gotten',
        ].includes(damageType)
      "
    >
      <td
        v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
        class="text-center"
      >
        {{
          damageType === "dmg"
            ? player.damagePercentageTotal
            : damageType === "rdps"
            ? player.rDpsPercentageTotal
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
      <td
        v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
        class="text-center"
      >
        <AbbreviatedNumberTemplate :val="DPS" :hover="true" />
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
        <template v-if="player.hits.totalFrontAttack > 0">
          {{
            (
              (player.hits.frontAttack / player.hits.totalFrontAttack) *
              100
            ).toFixed(1)
          }}
          <span class="ex">%</span>
        </template>
      </td>
      <td
        v-if="
          damageType === 'dmg' &&
          settingsStore.settings.damageMeter.tabs.baRate.enabled
        "
        class="text-center"
      >
        <template v-if="player.hits.totalBackAttack > 0">
          {{
            (
              (player.hits.backAttack / player.hits.totalBackAttack) *
              100
            ).toFixed(1)
          }}
          <span class="ex">%</span>
        </template>
      </td>
      <td v-if="damageType === 'rdps'" class="text-center">
        <!--Recv-->
        <AbbreviatedNumberTemplate
          :val="player.damageInfo.rdpsDamageReceived"
          :hover="true"
        />
      </td>
      <td v-if="damageType === 'rdps'" class="text-center">
        <!--Givn-->
        <AbbreviatedNumberTemplate
          :val="player.damageInfo.rdpsDamageGiven"
          :hover="true"
        />
      </td>
      <td v-if="damageType === 'rdps'" class="text-center">
        <!--Recv/s-->
        <AbbreviatedNumberTemplate
          :val="
            player.damageInfo.rdpsDamageReceived / (props.fightDuration / 1000)
          "
          :hover="true"
        />
      </td>
      <td v-if="damageType === 'rdps'" class="text-center">
        <!--Givn/s-->
        <AbbreviatedNumberTemplate
          :val="
            player.damageInfo.rdpsDamageGiven / (props.fightDuration / 1000)
          "
          :hover="true"
        />
      </td>
      <td
        v-if="
          ['dmg', 'rdps'].includes(damageType) &&
          settingsStore.settings.damageMeter.tabs.rdpsSynPercent.enabled
        "
        class="text-center"
      >
        {{
          (
            (player.damageInfo.rdpsDamageReceived /
              (player.damageInfo.damageDealt -
                player.damageInfo.rdpsDamageReceived)) *
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
      <template v-if="['shield_given', 'shield_gotten'].includes(damageType)">
        <td
          v-for="[columnKey, columnData] of sortedAppliedShieldingBuffs"
          :key="columnKey"
          style="width: 90px; text-align: center"
        >
          <AbbreviatedNumberTemplate
            :val="getShieldTableEntry(player, damageType, columnData)"
            :hide-zero="true"
            :hover="true"
          />
        </td>
      </template>
      <template v-if="['eshield_given', 'eshield_gotten'].includes(damageType)">
        <td
          v-for="[columnKey, columnData] of sortedEffectiveShieldingBuffs"
          :key="columnKey"
          style="width: 90px; text-align: center"
        >
          <AbbreviatedNumberTemplate
            :val="getShieldTableEntry(player, damageType, columnData)"
            :hide-zero="true"
            :hover="true"
          />
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
            settingsStore.settings.damageMeter.tabs.hOtherBuff.enabled)
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
      v-if="damageType === 'dmg' && true /* rdps settings */"
      class="player-bar"
      :style="`width: ${player.baseDamagePercentageTop}%;background: ${
        player.isEsther
          ? settingsStore.settings.damageMeter.functionality.estherColor
          : settingsStore.getClassColor(getClassName(player.classId))
      };`"
    ></div>
    <div
      v-if="damageType === 'dmg' && true /* rdps settings */"
      class="player-bar"
      :style="`margin-left: ${player.baseDamagePercentageTop}%; width: ${
        player.recvDamagePercentageTop
      }%;background: ${
        player.isEsther
          ? settingsStore.settings.damageMeter.functionality.estherColor
          : settingsStore.getClassColor(getClassName(player.classId))
      };opacity: 0.5;`"
    ></div>
    <div
      v-else
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
                  : damageType === 'rdps'
                  ? player.rDpsPercentageTop
                  : player.damagePercentageTop
              }%;
              background:${
                player.isEsther
                  ? settingsStore.settings.damageMeter.functionality.estherColor
                  : settingsStore.getClassColor(getClassName(player.classId))
              };
              `"
    >
      <!-- Player percentage bar -->
    </div>
  </tr>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { useSettingsStore } from "src/stores/settings";
import { GameState, StatusEffect } from "meter-core/logger/data";
import BuffTableBodyEntry from "./BuffTableBodyEntry.vue";
import {
  DamageType,
  EntityExtended,
  getBuffPercent,
  getClassName,
  getIconPath,
  getRdps,
} from "../../util/helpers";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
import PCData from "/meter-data/databases/PCData.json";
import AbbreviatedNumberTemplate from "./AbbreviatedNumberTemplate.vue";
import { getShieldTableEntry } from "../../util/helpers";

const settingsStore = useSettingsStore();
const props = defineProps({
  player: { type: Object as PropType<EntityExtended> },
  sortedBuffs: { type: Map<string, Map<number, StatusEffect>>, required: true },
  sortedAppliedShieldingBuffs: {
    type: Map<string, Map<number, StatusEffect>>,
    required: true,
  },
  sortedEffectiveShieldingBuffs: {
    type: Map<string, Map<number, StatusEffect>>,
    required: true,
  },
  damageType: { type: String as PropType<DamageType>, default: "dmg" },
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
  const nameDisplay = props.player.isEsther ? "name" : props.nameDisplay;
  let hasName = false;
  if (nameDisplay.includes("name")) {
    hasName = true;
    res += props.player.name + " ";
  }

  if (nameDisplay.includes("gear") || nameDisplay.includes("class")) {
    if (hasName) res += "(";

    let hasGearScore = false;
    if (
      nameDisplay.includes("gear") &&
      props.player.gearScore &&
      props.player.gearScore != 0
    ) {
      res += Math.round(props.player.gearScore * 100) / 100;
      hasGearScore = true;
    }

    if (nameDisplay.includes("class")) {
      if (hasGearScore) {
        res += " ";
      }

      res += getClassName(props.player.classId);
    }

    if (hasName) res += ")";
  }

  return res;
});
const DAMAGE = computed(() => {
  if (!props.player) return 0;
  let damage = props.player.damageInfo.damageDealt;

  if (props.damageType === "rdps") damage = getRdps(props.player);
  else if (props.damageType === "tank") damage = props.player.damageTaken;
  else if (props.damageType === "heal") damage = props.player.healingDone;
  else if (props.damageType === "shield_given")
    damage = props.player.shieldDone;
  else if (props.damageType === "shield_gotten")
    damage = props.player.shieldReceived;
  else if (props.damageType === "eshield_given")
    damage = props.player.damagePreventedWithShieldOnOthers;
  else if (props.damageType === "eshield_gotten")
    damage = props.player.damagePreventedByShield;

  return damage;
});

const DPS = computed(() => {
  if (!props.player) return 0;
  let a = props.player.damageInfo.damageDealt;

  if (props.damageType === "rdps") a = getRdps(props.player);
  else if (props.damageType === "tank") a = props.player.damageTaken;
  else if (props.damageType === "heal") a = props.player.healingDone;
  else if (props.damageType === "shield_given") a = props.player.shieldDone;
  else if (props.damageType === "shield_gotten")
    a = props.player.shieldReceived;
  else if (props.damageType === "eshield_given")
    a = props.player.damagePreventedWithShieldOnOthers;
  else if (props.damageType === "eshield_gotten")
    a = props.player.damagePreventedByShield;
  return a / (props.fightDuration / 1000); //return abbreviateNumber((a / (props.fightDuration / 1000)).toFixed(0));
});

const deathTime = computed(() => {
  if (!props.player) return "";
  if (props.player.isDead) {
    const curDate = props.lastCombatPacket;
    return ((curDate - props.player.deathTime) / 1000).toFixed(0) + "s";
  }
  return "";
});

function getClassImage(classId: number, override: string | undefined) {
  if (override !== undefined) {
    return getIconPath(override);
  }
  if (classId in PCData)
    return new URL(
      `../../assets/images/classes/${classId}.png`,
      import.meta.url
    ).href;

  return new URL("../../assets/images/classes/101.png", import.meta.url).href;
}
</script>
