<template>
  <tr>
    <td class="td-skill-img">
      <img :src="getIconPath(skill.icon)" />
      <q-tooltip class="dmg_full_value" anchor="top middle" self="bottom middle">{{ skill.id }}</q-tooltip>
    </td>
    <td class="ellipsis">{{ skill.name }}</td>
    <td v-if="tabsIncludes('damage')" class="text-center">
      <AbbreviatedNumberTemplate :val="skill.damageInfo.damageDealt" :hover="true" />
    </td>
    <template v-if="['dmg', 'rdps', 'tank', 'heal'].includes(damageType)">
      <td v-if="tabsIncludes('damagePercent')" class="text-center">
        {{ skill.damagePercent }}<span class="ex">%</span>
      </td>
      <td v-if="tabsIncludes('dps')" class="text-center">
        <AbbreviatedNumberTemplate :val="DPS" :hover="true" />
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('critRate')" class="text-center">
        {{ skill.hits.total > 0 ? ((skill.hits.crit / skill.hits.total) * 100).toFixed(1) : (0).toFixed(1) }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('faRate')" class="text-center">
        <template v-if="skill.hits.totalFrontAttack > 0">
          {{ ((skill.hits.frontAttack / skill.hits.totalFrontAttack) * 100).toFixed(1) }}
          <span class="ex">%</span>
        </template>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('baRate')" class="text-center">
        <template v-if="skill.hits.totalBackAttack > 0">
          {{ ((skill.hits.backAttack / skill.hits.totalBackAttack) * 100).toFixed(1) }}
          <span class="ex">%</span>
        </template>
      </td>
      <td v-if="['dmg', 'rdps'].includes(damageType) && tabsIncludes('rdpsSynPercent')" class="text-center">
        {{
          (
            (skill.damageInfo.rdpsDamageReceived /
              (skill.damageInfo.damageDealt - skill.damageInfo.rdpsDamageReceived)) *
            100
          ).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('maxDmg')" class="text-center">
        {{ maxDamage[0] }}
        <span class="ex">
          {{ maxDamage[1] }}
        </span>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('avgDmg')" class="text-center">
        {{ avgDamage[0] }}
        <span class="ex">
          {{ avgDamage[1] }}
        </span>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('avgCast')" class="text-center">
        {{ avgCast[0] }}
        <span class="ex">
          {{ avgCast[1] }}
        </span>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('totalHits')" class="text-center">
        {{ skill.hits.total }}
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('totalCasts')" class="text-center">
        {{ skill.hits.casts }}
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('hpm')" class="text-center">
        {{ HPM[0] }}
        <span class="ex">
          {{ HPM[1] }}
        </span>
      </td>
      <td v-if="damageType === 'dmg' && tabsIncludes('cpm')" class="text-center">
        {{ CPM[0] }}
        <span class="ex">
          {{ CPM[1] }}
        </span>
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
          (damageType === 'party_buff_dmg' && tabsIncludes('dPartyBuff')) ||
          (damageType === 'party_buff_hit' && tabsIncludes('hPartyBuff')) ||
          (damageType === 'self_buff_dmg' && tabsIncludes('dSelfBuff')) ||
          (damageType === 'self_buff_hit' && tabsIncludes('hSelfBuff')) ||
          (damageType === 'other_buff_dmg' && tabsIncludes('dOtherBuff')) ||
          (damageType === 'other_buff_hit' && tabsIncludes('dOtherBuff'))
        "
      >
        <td v-for="[columnKey, columnData] of sortedBuffs" :key="columnKey" style="width: 90px; text-align: center">
          <BuffTableBodyEntry
            :buff-entry="getBuffPercent(skill, damageType, columnData)"
            :entry-data="skill"
            :buff-data="columnData"
          />
        </td>
      </template>
    </template>
    <!--
    <template v-else-if="['buff_dmg', 'buff_hit'].includes(damageType)">
      <template
        v-if="
          sessionState.damageStatistics &&
          (tabsIncludes('dDebuffed') ||
            tabsIncludes('hDebuffed'))
        "
      >
        <td
          v-for="statusEffecdId in sessionState.damageStatistics.debuffs"
          :key="statusEffecdId"
          style="text-align: center"
        >
          <template
            v-if="
              tabsIncludes('dDebuffed') &&
              damageType === 'buff_dmg'
            "
          >
            {{
              skill.damageDebuffedBy.has(statusEffecdId) &&
              skill.totalDamage > 0
                ? (
                    (skill.damageDebuffedBy.get(statusEffecdId) /
                      skill.totalDamage) *
                    100
                  ).toFixed(1)
                : 0
            }}
            <span class="ex">% </span>
          </template>
          <template
            v-if="
              tabsIncludes('hDebuffed') &&
              damageType === 'buff_hit'
            "
          >
            {{
              skill.hits.hitsDebuffedBy.has(statusEffecdId) &&
              skill.hits.total > 0
                ? (
                    (skill.hits.hitsDebuffedBy.get(statusEffecdId) /
                      skill.hits.total) *
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
          (tabsIncludes('dBuffed') ||
            tabsIncludes('hBuffed'))
        "
      >
        <td
          v-for="statusEffecdId in sessionState.damageStatistics.buffs"
          :key="statusEffecdId"
          style="text-align: center"
        >
          <template
            v-if="
              tabsIncludes('dBuffed') &&
              damageType === 'buff_dmg'
            "
          >
            {{
              skill.damageBuffedBy.has(statusEffecdId) && skill.totalDamage > 0
                ? (
                    (skill.damageBuffedBy.get(statusEffecdId) /
                      skill.totalDamage) *
                    100
                  ).toFixed(1)
                : 0
            }}
            <span class="ex">% </span>
          </template>
          <template
            v-if="
              tabsIncludes('hBuffed') &&
              damageType === 'buff_hit'
            "
          >
            {{
              skill.hits.hitsBuffedBy.has(statusEffecdId) &&
              skill.hits.total > 0
                ? (
                    (skill.hits.hitsBuffedBy.get(statusEffecdId) /
                      skill.hits.total) *
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
      :style="`width: ${skill.baseDamagePercentageTop}%;background: ${color};`"
    ></div>
    <div
      v-if="damageType === 'dmg' && true /* rdps settings */"
      class="player-bar"
      :style="`margin-left: ${skill.baseDamagePercentageTop}%; width: ${skill.recvDamagePercentageTop}%;background: ${color};opacity: 0.5;`"
    ></div>
    <div
      v-else
      class="player-bar"
      :style="`
              width:${skill.relativePercent}%;
              background:${color};
              `"
    ></div>
  </tr>
</template>

<script setup lang="ts">
import { GameState, StatusEffect } from "meter-core/logger/data";
import { abbreviateNumber } from "src/util/number-helpers";
import { tabsIncludes } from "stores/settings";
import { computed, PropType } from "vue";
import { DamageType, EntitySkillsExtended, getBuffPercent, getIconPath } from "../../util/helpers";
import AbbreviatedNumberTemplate from "./AbbreviatedNumberTemplate.vue";
import BuffTableBodyEntry from "./BuffTableBodyEntry.vue";

const props = defineProps({
  sortedBuffs: { type: Map<string, Map<number, StatusEffect>>, required: true },
  sessionState: { type: Object as PropType<GameState>, required: true },
  skill: { type: Object as PropType<EntitySkillsExtended>, required: true },
  damageType: { type: String as PropType<DamageType>, required: true },
  color: { type: String, required: true },
  fightDuration: { type: Number, required: true },
});

const DPS = computed(() => {
  return props.skill.damageInfo.damageDealt / (props.fightDuration / 1000);
});

const HPM = computed(() => {
  return abbreviateNumber(props.skill.hits.total / (props.fightDuration / 1000 / 60));
});
const CPM = computed(() => {
  return abbreviateNumber(props.skill.hits.casts / (props.fightDuration / 1000 / 60));
});

const maxDamage = computed(() => {
  return abbreviateNumber(props.skill.maxDamage);
});

const avgDamage = computed(() => {
  if (props.skill.hits.total === 0) return abbreviateNumber(props.skill.damageInfo.damageDealt);
  return abbreviateNumber(props.skill.damageInfo.damageDealt / props.skill.hits.total);
});
const avgCast = computed(() => {
  if (props.skill.hits.total === 0) return abbreviateNumber(props.skill.damageInfo.damageDealt);
  return abbreviateNumber(props.skill.damageInfo.damageDealt / props.skill.hits.casts);
});
</script>
