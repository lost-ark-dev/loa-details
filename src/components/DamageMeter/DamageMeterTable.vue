<template>
  <div class="damage-meter-table-wrapper">
    <table class="damage-meter-table">
      <thead v-if="focusedPlayer === '#'" class="q-electron-drag">
        <tr>
          <th style="width: 26px"></th>
          <th style="width: 100%"></th>
          <th style="width: 72px">
            {{ damageType === "dmg" ? "Damage" : "Tanked" }}
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
            style="width: 48px"
          >
            {{ damageType === "dmg" ? "D" : "T" }}%
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
            style="width: 52px"
          >
            {{ damageType === "dmg" ? "DPS" : "TPS" }}
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.critRate.enabled"
            style="width: 48px"
          >
            CRIT
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.faRate.enabled"
            style="width: 48px"
          >
            F.A.
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
            style="width: 48px"
          >
            B.A.
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.counterCount.enabled"
            style="width: 44px"
          >
            CNTR
          </th>
        </tr>
      </thead>
      <thead v-else-if="focusedPlayer !== '#'">
        <tr>
          <th style="width: 32px"></th>
          <th style="width: 100%"></th>
          <th style="width: 72px">Damage</th>
          <th style="width: 48px">D%</th>
          <th style="width: 52px">DPS</th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.critRate.enabled"
            style="width: 48px"
          >
            CRIT
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.faRate.enabled"
            style="width: 48px"
          >
            F.A.
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
            style="width: 48px"
          >
            B.A.
          </th>
          <th style="width: 44px">MaxHit</th>
          <th style="width: 52px">TotalHits</th>
        </tr>
      </thead>
      <tbody v-if="focusedPlayer === '#' && sortedEntities">
        <TableEntry
          v-for="player in sortedEntities"
          :key="player.id"
          :player="player"
          :showTanked="damageType === 'tank'"
          :fightDuration="Math.max(1000, sessionState.duration)"
          @click="focusPlayer(player)"
        />
      </tbody>
      <tbody v-else-if="focusedPlayer !== '#' && sortedSkills">
        <SkillEntry
          v-for="skill in sortedSkills"
          :key="skill.name"
          :skill="skill"
          :className="focusedPlayerClass"
          :fightDuration="Math.max(1000, sessionState.duration)"
          @click.right="focusedPlayer = '#'"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { cloneDeep } from "lodash";
import { useSettingsStore } from "src/stores/settings";

import TableEntry from "./TableEntry.vue";
import SkillEntry from "./SkillEntry.vue";

const settingsStore = useSettingsStore();
const props = defineProps({
  sessionState: Object,
  damageType: {
    type: String,
    default: "dmg",
  },
});
const entitiesCopy = ref([]);

watch(props, () => {
  sortEntities();
});
onMounted(() => {
  sortEntities();
});

const focusedPlayer = ref("#");
const focusedPlayerClass = ref("");
function focusPlayer(player) {
  focusedPlayer.value = player.name;
  focusedPlayerClass.value = player.class;
  calculateSkills();
}

const sortedEntities = ref([]);
const sortedSkills = ref([]);

function sortEntities() {
  entitiesCopy.value = cloneDeep(Object.values(props.sessionState.entities));
  const res = entitiesCopy.value
    .filter(
      (entity) =>
        entity.isPlayer &&
        (props.damageType === "dmg"
          ? entity.damageDealt > 0
          : entity.damageTaken > 0)
    )
    .sort((a, b) => {
      if (settingsStore.settings.damageMeter.design.pinUserToTop) {
        if (a.name === "You") return -1e69;
        else if (b.name === "You") return 1e69; // nice
      }

      return props.damageType === "dmg"
        ? b.damageDealt - a.damageDealt
        : b.damageTaken - a.damageTaken;
    });

  for (const entity of res) {
    entity.damagePercentageTotal = getPercentage(entity, "dmg", "total");
    entity.damagePercentageTop = getPercentage(entity, "dmg", "top");

    entity.tankPercentageTotal = getPercentage(entity, "tank", "total");
    entity.tankPercentageTop = getPercentage(entity, "tank", "top");
  }

  sortedEntities.value = res;
  calculateSkills();
}

function calculateSkills() {
  sortedSkills.value = [];
  if (focusedPlayer.value === "#") return;

  const entity = entitiesCopy.value.find((e) => {
    return e.name === focusedPlayer.value;
  });
  if (!entity) return;

  const res = Object.values(entity.skills).sort(
    (a, b) => b.totalDamage - a.totalDamage
  );

  for (const skill of res) {
    skill.damagePercent = (
      (skill.totalDamage / entity.damageDealt) *
      100
    ).toFixed(1);
    skill.relativePercent = (
      (skill.totalDamage / res[0].totalDamage) *
      100
    ).toFixed(1);
  }

  sortedSkills.value = res;
}

function getPercentage(player, dmgType, relativeTo) {
  let a = player.damageDealt;
  if (dmgType === "tank") a = player.damageTaken;
  let b;
  if (dmgType === "dmg") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topDamageDealt;
    else b = props.sessionState.damageStatistics.totalDamageDealt;
  } else {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topDamageTaken;
    else b = props.sessionState.damageStatistics.totalDamageTaken;
  }
  return ((a / b) * 100).toFixed(1);
}
</script>

<style>
.damage-meter-table-wrapper {
  overflow-y: scroll;
}
.damage-meter-table-wrapper::-webkit-scrollbar {
  display: none;
}
.damage-meter-table {
  font-family: "Segoe UI", "Segoe UI", "sans-serif";
  z-index: 100;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.damage-meter-table thead {
  position: sticky;
  top: 0;
  background: black;
  z-index: 10000;
}
.damage-meter-table thead tr {
  color: rgb(189, 189, 189);
  font-size: 11px;
}
.damage-meter-table tbody tr {
  position: relative;
  height: 28px;
  color: #ffffff;
  font-size: 12px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
}
.damage-meter-table .ex {
  font-size: 10px;
  color: rgb(189, 189, 189);
}
.td-class-img,
.td-skill-img {
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.5),
    rgba(0, 0, 0, 0)
  );
}
.td-class-img img {
  width: 16px;
  margin-left: 4px;
  margin-top: 4px;
}
.td-skill-img img {
  width: 20px;
  margin-left: 6px;
  margin-top: 4px;
}

.player-bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -100;
  opacity: 0.75;
  height: 28px;
  transition: 100ms;
}
</style>
