<template>
  <div>
    <!-- Encounter selection -->
    <div class="info-box">
      <div v-if="logData">
        <span style="margin-right: 12px">
          Total DMG
          {{ numberFormat(logData.damageStatistics.totalDamageDealt) }}
        </span>
        <span style="margin-right: 12px">
          Total TNK
          {{ numberFormat(logData.damageStatistics.totalDamageTaken) }}
        </span>
      </div>
    </div>
    <div
      v-if="logData && overlayType === OverlayTypeDamages"
      class="table-wrapper"
    >
      <table class="damage-meter-table">
        <thead>
          <tr>
            <th style="width: 26px"></th>
            <th style="width: 100%"></th>
            <th style="width: 72px">
              {{ damageType === DamageTypeDealt ? "Damage" : "Tanked" }}
            </th>
            <th
              v-if="
                settingsStore.settings.damageMeter.tabs.damagePercent.enabled
              "
              style="width: 48px"
            >
              {{ damageType === DamageTypeDealt ? "D" : "T" }}%
            </th>
            <th
              v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
              style="width: 52px"
            >
              {{ damageType === DamageTypeDealt ? "DPS" : "TPS" }}
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
              v-if="
                settingsStore.settings.damageMeter.tabs.counterCount.enabled
              "
              style="width: 44px"
            >
              CNTR
            </th>
          </tr>
        </thead>
        <tbody>
          <TableEntry
            v-for="player in sortedEntities"
            :key="player.name"
            :player="player"
            :showTanked="damageType === DamageTypeTaken"
            :fightDuration="logData.duration"
            @click="focusPlayer(player)"
          />
        </tbody>
      </table>
    </div>
    <div
      v-if="logData && overlayType === OverlayTypeSkills"
      class="table-wrapper"
    >
      <table class="damage-meter-table">
        <thead>
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
        <tbody>
          <SkillEntry
            v-for="skill in sortedSkills"
            :key="skill.name"
            :skill="skill"
            :className="focusedPlayerClass"
            :fightDuration="logData.duration"
            @click.right="overlayType = OverlayTypeDamages"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

import TableEntry from "../components/DamageMeter/TableEntry.vue";
import SkillEntry from "../components/DamageMeter/SkillEntry.vue";

import { useSettingsStore } from "../stores/settings";

import { cloneDeep } from "lodash";

const settingsStore = useSettingsStore();

const props = defineProps({
  logData: Object,
});

const DamageTypeDealt = Symbol("dealt");
const DamageTypeTaken = Symbol("taken");
const damageType = ref(DamageTypeDealt);

const OverlayTypeDamages = Symbol("damage-overlay");
const OverlayTypeSkills = Symbol("skill-overlay");
const overlayType = ref(OverlayTypeDamages);

const focusedPlayer = ref("#");
const focusedPlayerClass = ref("");
function focusPlayer(player) {
  focusedPlayer.value = player.name;
  focusedPlayerClass.value = player.class;
  overlayType.value = OverlayTypeSkills;
  calculateSkills();
}

const sortedEntities = ref([]);
function sortEntities() {
  const res = cloneDeep(Object.values(props.logData.entities))
    .filter((entity) => entity.isPlayer && entity.damageDealt > 0)
    .sort((a, b) => {
      if (settingsStore.settings.damageMeter.design.pinUserToTop) {
        if (a.name === "You") return -1e69;
        else if (b.name === "You") return 1e69; // nice
      }

      return damageType.value === DamageTypeDealt
        ? b.damageDealt - a.damageDealt
        : b.damageTaken - a.damageTaken;
    });

  for (const entity of res) {
    entity.damagePercentageTotal = getPercentage(
      entity,
      DamageTypeDealt,
      "total"
    );
    entity.damagePercentageTop = getPercentage(entity, DamageTypeDealt, "top");

    entity.tankPercentageTotal = getPercentage(
      entity,
      DamageTypeTaken,
      "total"
    );
    entity.tankPercentageTop = getPercentage(entity, DamageTypeTaken, "top");
  }

  sortedEntities.value = res;
  calculateSkills();
}

const sortedSkills = ref([]);
function calculateSkills() {
  sortedSkills.value = [];
  if (focusedPlayer.value === "#") return;

  const entity = cloneDeep(Object.values(props.logData.entities)).find((e) => {
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
  if (dmgType === DamageTypeTaken) a = player.damageTaken;
  let b;
  if (dmgType === DamageTypeDealt) {
    if (relativeTo === "top") {
      b = props.logData.damageStatistics.topDamageDealt;
    } else {
      b = props.logData.damageStatistics.totalDamageDealt;
    }
  } else {
    if (relativeTo === "top") {
      b = props.logData.damageStatistics.topDamageTaken;
    } else {
      b = props.logData.damageStatistics.totalDamageTaken;
    }
  }
  return ((a / b) * 100).toFixed(1);
}

function numberFormat(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function onNewLogData() {
  sortEntities();
}

onMounted(() => {
  onNewLogData();
});
watch(props.logData, (newVal, oldVal) => {
  onNewLogData();
});
</script>

<style>
.info-box {
  font-size: 11px;
  padding: 8px 0;
}
.table-wrapper {
  overflow-y: scroll;
}
.table-wrapper::-webkit-scrollbar {
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
.ex {
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
