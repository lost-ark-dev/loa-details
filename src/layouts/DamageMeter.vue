<template>
  <div>
    <nav
      v-if="
        !settingsStore.settings.damageMeter.design.compactDesign || isMinimized
      "
      class="nav q-electron-drag"
    >
      <span v-if="!isMinimized" class="time">
        {{ millisToMinutesAndSeconds(fightDuration) }}
      </span>
      <div class="info-box">
        <span>LOA Details</span>
        <br />
        <div v-if="!isMinimized">
          <span style="margin-right: 12px">
            Total DMG
            {{ numberFormat(sessionState.damageStatistics.totalDamageDealt) }}
          </span>
          <span style="margin-right: 12px">
            Total TNK
            {{ numberFormat(sessionState.damageStatistics.totalDamageTaken) }}
          </span>
        </div>
      </div>
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
      <thead class="q-electron-drag">
        <tr>
          <th style="width: 26px"></th>
          <th style="width: 100%"></th>
          <th style="width: 72px">
            {{ damageType === DamageTypeDealt ? "Damage" : "Tanked" }}
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
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
            v-if="settingsStore.settings.damageMeter.tabs.counterCount.enabled"
            style="width: 44px"
          >
            CNTR
          </th>
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
        <span v-if="settingsStore.settings.damageMeter.design.compactDesign">
          {{ millisToMinutesAndSeconds(fightDuration) }}
        </span>
        <q-btn flat size="sm" @click="requestSessionRestart">
          RESET SESSION
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { Notify } from "quasar";

import TableEntry from "../components/DamageMeter/TableEntry.vue";

import { useSettingsStore } from "../stores/settings";
const settingsStore = useSettingsStore();

const isMinimized = ref(false);
const isAutoMinimized = ref(false);

function toggleMinimizedState() {
  isMinimized.value = !isMinimized.value;

  window.messageApi.send("window-to-main", {
    message: "toggle-damage-meter-minimized-state",
    value: isMinimized.value,
  });
}

const sessionDuration = ref(0);
const fightDuration = ref(0);

const DamageTypeDealt = Symbol("dealt");
const DamageTypeTaken = Symbol("taken");
const damageType = ref(DamageTypeDealt);

const sessionState = reactive({
  entities: [],
  startedOn: +new Date(),
  damageStatistics: {
    totalDamageDealt: 0,
    topDamageDealt: 0,
    totalDamageTaken: 0,
    topDamageTaken: 0,
  },
});
const sortedEntities = reactive([]);
function sortEntities() {
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

  Object.assign(sortedEntities, res);
}

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
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function numberFormat(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function requestSessionRestart() {
  window.messageApi.send("window-to-main", { message: "reset-session" });
}

onMounted(() => {
  settingsStore.initSettings();

  window.messageApi.receive("on-settings-change", (value) => {
    settingsStore.loadSettings(value);
  });

  window.messageApi.send("window-to-main", { message: "get-settings" });

  window.messageApi.receive("pcap-on-state-change", (value) => {
    sessionState.damageStatistics = value.damageStatistics;
    sessionState.startedOn = value.startedOn;
    sessionState.fightStartedOn = value.fightStartedOn;
    sessionState.lastCombatPacket = value.lastCombatPacket;
    sessionState.entities = Object.values(value.entities);
    sortEntities();
  });

  window.messageApi.receive("pcap-on-message", (value) => {
    if (value === "new-zone") {
      Notify.create({
        progress: true,
        timeout: 5000,
        message: "Changed zone, resetting session.",
        color: "primary",
        actions: [
          {
            label: "Cancel",
            color: "dark",
            handler: () => {
              window.messageApi.send("window-to-main", {
                message: "cancel-reset-session",
              });

              Notify.create({
                message:
                  "Reset cancelled. Session won't reset until you click reset or change zones again.",
              });
            },
          },
        ],
      });
    } else {
      Notify.create({
        message: value,
      });
    }
  });

  setInterval(() => {
    const curTime = +new Date();

    sessionDuration.value = curTime - sessionState.startedOn;

    if (sessionState.fightStartedOn > 0)
      fightDuration.value = curTime - sessionState.fightStartedOn;
    else fightDuration.value = 0;

    if (settingsStore.settings.damageMeter.functionality.autoMinimize) {
      let sendResizeMessage = false;
      const diff = curTime - sessionState.lastCombatPacket;
      if (!isAutoMinimized.value && diff >= 3000) {
        isMinimized.value = true;
        isAutoMinimized.value = true;
        sendResizeMessage = true;
      }
      if (isAutoMinimized.value && diff < 3000) {
        isMinimized.value = false;
        isAutoMinimized.value = false;
        sendResizeMessage = true;
      }

      if (sendResizeMessage) {
        window.messageApi.send("window-to-main", {
          message: "toggle-damage-meter-minimized-state",
          value: isMinimized.value,
        });

        sendResizeMessage = false;
      }
    }
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
  height: 64px;
  font-size: 14px;
  padding: 0 8px;
}
.footer {
  height: 32px !important;
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
.nav .time {
  font-size: 32px;
  margin-left: 8px;
  color: #fff;
}
.nav .info-box {
  margin-left: 12px;
  font-size: 11px;
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
