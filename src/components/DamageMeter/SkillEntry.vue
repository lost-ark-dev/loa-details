<template>
  <tr>
    <td class="td-skill-img">
      <img :src="getIconPath(skill.icon)" />
      <q-tooltip
        class="dmg_full_value"
        anchor="top middle"
        self="bottom middle"
        >{{ skill.id }}</q-tooltip
      >
    </td>
    <td class="ellipsis">{{ skill.name }}</td>
    <td
      v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
      class="text-center"
    >
      <AbbreviatedNumberTemplate :val="skill.damageDealt" :hover="true" />
    </td>
    <template v-if="['dmg', 'tank', 'heal'].includes(damageType)">
      <td
        v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
        class="text-center"
      >
        {{ skill.damagePercent }}<span class="ex">%</span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
        class="text-center"
      >
        <AbbreviatedNumberTemplate :val="DPS" :hover="true" />
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
        <template v-if="skill.hits.totalFrontAttack > 0">
          {{
            (
              (skill.hits.frontAttack / skill.hits.totalFrontAttack) *
              100
            ).toFixed(1)
          }}
          <span class="ex">%</span>
        </template>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
        class="text-center"
      >
        <template v-if="skill.hits.totalBackAttack > 0">
          {{
            (
              (skill.hits.backAttack / skill.hits.totalBackAttack) *
              100
            ).toFixed(1)
          }}
          <span class="ex">%</span>
        </template>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.hBuffedBySup.enabled"
        class="text-center"
      >
        {{
          skill.hits.total > 0
            ? (
                (skill.hits.hitsBuffedBySupport / skill.hits.total) *
                100
              ).toFixed(1)
            : (0).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.hDebuffedBySup.enabled"
        class="text-center"
      >
        {{
          skill.hits.total > 0
            ? (
                (skill.hits.hitsDebuffedBySupport / skill.hits.total) *
                100
              ).toFixed(1)
            : (0).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.dBuffedBySup.enabled"
        class="text-center"
      >
        {{
          skill.hits.total > 0
            ? (
                (skill.damageDealtBuffedBySupport / skill.damageDealt) *
                100
              ).toFixed(1)
            : (0).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.dDebuffedBySup.enabled"
        class="text-center"
      >
        {{
          skill.hits.total > 0
            ? (
                (skill.damageDealtDebuffedBySupport / skill.damageDealt) *
                100
              ).toFixed(1)
            : (0).toFixed(1)
        }}
        <span class="ex">%</span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.maxDmg.enabled"
        class="text-center"
      >
        {{ maxDamage[0] }}
        <span class="ex">
          {{ maxDamage[1] }}
        </span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.avgDmg.enabled"
        class="text-center"
      >
        {{ avgDamage[0] }}
        <span class="ex">
          {{ avgDamage[1] }}
        </span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.avgCast.enabled"
        class="text-center"
      >
        {{ avgCast[0] }}
        <span class="ex">
          {{ avgCast[1] }}
        </span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.totalHits.enabled"
        class="text-center"
      >
        {{ skill.hits.total }}
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.totalCasts.enabled"
        class="text-center"
      >
        {{ skill.hits.casts }}
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.hpm.enabled"
        class="text-center"
      >
        {{ HPM[0] }}
        <span class="ex">
          {{ HPM[1] }}
        </span>
      </td>
      <td
        v-if="settingsStore.settings.damageMeter.tabs.cpm.enabled"
        class="text-center"
      >
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
            :buffEntry="getBuffPercent(skill, damageType, columnData)"
            :entry-data="skill"
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
              settingsStore.settings.damageMeter.tabs.hDebuffed.enabled &&
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
              settingsStore.settings.damageMeter.tabs.hBuffed.enabled &&
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
      class="player-bar"
      :style="`
              width:${skill.relativePercent}%;
              background:${settingsStore.getClassColor(className)};
              `"
    ></div>
  </tr>
</template>

<script setup lang="ts">
import { computed, PropType } from "vue";
import { skills } from "src/constants/skills.js";
import { abbreviateNumber } from "src/util/number-helpers";
import { useSettingsStore } from "src/stores/settings";
import { GameState, StatusEffect } from "meter-core/logger/data";
import BuffTableBodyEntry from "./BuffTableBodyEntry.vue";
import {
  getIconPath,
  getBuffPercent,
  EntitySkillsExtended,
} from "../../util/helpers";
import AbbreviatedNumberTemplate from "./AbbreviatedNumberTemplate.vue";

const settingsStore = useSettingsStore();

const props = defineProps({
  sortedBuffs: { type: Map<string, Map<number, StatusEffect>>, required: true },
  sessionState: { type: Object as PropType<GameState>, required: true },
  skill: { type: Object as PropType<EntitySkillsExtended>, required: true },
  damageType: { type: String, default: "dmg" },
  className: { type: String, required: true },
  fightDuration: { type: Number, required: true },
});

const DPS = computed(() => {
  return props.skill.damageDealt / (props.fightDuration / 1000);
});

const HPM = computed(() => {
  return abbreviateNumber(
    props.skill.hits.total / (props.fightDuration / 1000 / 60)
  );
});
const CPM = computed(() => {
  return abbreviateNumber(
    props.skill.hits.casts / (props.fightDuration / 1000 / 60)
  );
});

const maxDamage = computed(() => {
  return abbreviateNumber(props.skill.maxDamage);
});

const avgDamage = computed(() => {
  if (props.skill.hits.total === 0)
    return abbreviateNumber(props.skill.damageDealt);
  return abbreviateNumber(props.skill.damageDealt / props.skill.hits.total);
});
const avgCast = computed(() => {
  if (props.skill.hits.total === 0)
    return abbreviateNumber(props.skill.damageDealt);
  return abbreviateNumber(props.skill.damageDealt / props.skill.hits.casts);
});
type LOASkill = {
  id: number;
  name: string;
  display?: string;
  class: string;
  level: number;
  baseSkill?: number;
  icon?: boolean;
};
function getSkillImage(id: number): string {
  if (id > 99999) return getSkillImage(id / 10);
  const s = getSkill(id);
  if (s?.baseSkill) return getSkillImage(s.baseSkill);
  if (id % 5 && !s?.icon) return getSkillImage(id - (id % 5));

  if (s != null && skillHasIcon(s)) {
    return new URL(
      `../../assets/images/skills/${s.id}_${(s?.display ?? s.name).replace(
        ":",
        "-"
      )}.png`,
      import.meta.url
    ).href;
  }

  return new URL("../../assets/images/skills/unknown.png", import.meta.url)
    .href;
}

function getSkillName(skill: LOASkill) {
  const s = getSkill(skill.id);

  if (s != null) {
    if ("display" in s) return s.display;
  }
  return skill.name;
}

function skillHasIcon(s: LOASkill) {
  if (
    s.name.startsWith("Basic Attack") ||
    s?.display?.startsWith("Basic Attack") ||
    !(s?.icon ?? true)
  )
    return false;
  return true;
}
function getSkill(id: number) {
  return skills.find((k) => k.id == id);
}
</script>
