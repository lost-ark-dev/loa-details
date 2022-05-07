<template>
  <div class="damager">
    <nav class="nav q-electron-drag">
      <span class="title">LOA Details</span>
      <div style="margin-left: auto">
        <q-btn
          round
          :icon="isMinimized ? 'add' : 'remove'"
          @click="toggleMinimizedState"
          flat
          size="sm"
        />
      </div>
    </nav>
    <table v-if="!isMinimized" class="damage-meter-table">
      <thead>
        <tr>
          <th style="width: 26px"></th>
          <th style="width: 100%"></th>
          <th style="width: 52px">
            {{ damageType === DamageTypeDealt ? "DPS" : "TPS" }}
          </th>
          <th style="width: 48px">
            {{ damageType === DamageTypeDealt ? "D" : "T" }}%
          </th>
          <th style="width: 72px">
            {{ damageType === DamageTypeDealt ? "Damage" : "Tanked" }}
          </th>
          <th style="width: 48px">CRIT</th>
          <th style="width: 48px">F.A.</th>
          <th style="width: 48px">B.A.</th>
          <th style="width: 44px">CNTR</th>
        </tr>
      </thead>
      <tbody>
        <TableEntry
          v-for="player in sortedEntities"
          :key="player.id"
          :player="player"
          :showTanked="damageType === DamageTypeTaken"
          :fightDuration="Math.max(1000, fightDuration)"
        />
      </tbody>
    </table>
    <div v-if="!isMinimized" class="footer">
      <q-btn flat size="sm" @click="damageType = DamageTypeDealt">DMG</q-btn>
      <q-btn flat size="sm" @click="damageType = DamageTypeTaken">TANK</q-btn>
      <div style="margin-left: auto">
        <q-btn flat size="sm" @click="requestSessionRestart">RESET</q-btn>
        <span class="time">
          {{ millisToMinutesAndSeconds(fightDuration) }}
          ({{ millisToMinutesAndSeconds(sessionDuration) }})
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from "vue";
import { Notify } from "quasar";

import TableEntry from "../components/DamageMeter/TableEntry.vue";

let isMinimized = ref(false);
function toggleMinimizedState() {
  isMinimized.value = !isMinimized.value;

  window.messageApi.send("window-to-main", {
    message: "toggle-damage-meter-minimized-state",
    value: isMinimized.value,
  });
}

let sessionDuration = ref(0);
let fightDuration = ref(0);

const DamageTypeDealt = Symbol("dealt");
const DamageTypeTaken = Symbol("taken");
let damageType = ref(DamageTypeDealt);

let sessionState = reactive({
  entities: [],
  startedOn: +new Date(),
  damageStatistics: {
    totalDamageDealt: 0,
    topDamageDealt: 0,
    totalDamageTaken: 0,
    topDamageTaken: 0,
  },
});

const sortedEntities = computed(() => {
  const res = sessionState.entities
    .filter(
      (entity) =>
        entity.isPlayer &&
        (damageType.value === DamageTypeDealt
          ? entity.damageDealt > 0
          : entity.damageTaken > 0)
    )
    .sort((a, b) =>
      damageType.value === DamageTypeDealt
        ? b.damageDealt - a.damageDealt
        : b.damageTaken - a.damageTaken
    );

  for (const entity of res) {
    entity.percentageTotal = getPercentage(entity, "total");
    entity.percentageTop = getPercentage(entity, "top");
  }

  return res;
});

function getPercentage(player, relativeTo) {
  let a = player.damageDealt;
  if (damageType.value === DamageTypeTaken) a = player.damageTaken;

  let b;
  if (damageType.value === DamageTypeDealt) {
    if (relativeTo === "top") b = sessionState.damageStatistics.topDamageDealt;
    else b = sessionState.damageStatistics.totalDamageDealt;
  } else {
    if (relativeTo === "top") b = sessionState.damageStatistics.topDamageTaken;
    else b = sessionState.damageStatistics.totalDamageTaken;
  }

  return ((a / b) * 100).toFixed(1);
}

function millisToMinutesAndSeconds(millis) {
  let minutes = Math.floor(millis / 60000);
  let seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function requestSessionRestart() {
  window.messageApi.send("window-to-main", { message: "reset-session" });
}

onMounted(() => {
  window.messageApi.receive("pcap-on-state-change", (value) => {
    sessionState.entities = Object.values(value.entities);
    sessionState.damageStatistics = value.damageStatistics;
    sessionState.startedOn = value.startedOn;
    sessionState.fightStartedOn = value.fightStartedOn;
  });

  window.messageApi.receive("pcap-on-message", (value) => {
    Notify.create({
      message: value,
    });
  });

  setInterval(() => {
    sessionDuration.value = +new Date() - sessionState.startedOn;
    if (sessionState.fightStartedOn > 0)
      fightDuration.value = +new Date() - sessionState.fightStartedOn;
    else fightDuration.value = 0;
  }, 1000);
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  touch-action: manipulation;
}
html,
body {
  background-color: rgba(0, 0, 0, 0.3) !important;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: hidden;
}
html {
  color: #ffffff;
  font-family: "Segoe UI", "sans-serif";
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-transition: 0.3s;
}
::-webkit-scrollbar,
scrollbar {
  width: 0;
  height: 0;
}
div,
li {
  -ms-user-select: none;
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  list-style: none;
}
.click-through {
  pointer-events: none !important;
  user-select: none !important;
}
.overflow-hidden {
  overflow: hidden !important;
}
.text-center {
  text-align: center;
}
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav,
.footer {
  display: flex;
  align-items: center;
  background: rgb(22, 22, 22, 0.75);
  color: rgb(189, 189, 189);
  height: 32px;
  font-size: 14px;
  padding: 0 8px;
}
.nav .title {
  color: #fff;
}
.footer {
  position: fixed;
  width: 100%;
  bottom: 0;
  left: 0;
}
.footer .time {
  font-size: 12px;
  color: #fff;
}
.damage-meter-table {
  font-family: "Segoe UI", "Segoe UI", "sans-serif";
  z-index: 100;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.damage-meter-table thead tr {
  background: rgba(0, 0, 0, 0.5);
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
.td-class-img {
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
.player-bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -100;
  opacity: 0.75;
  height: 28px;
}
</style>
