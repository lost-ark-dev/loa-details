<template>
  <div>
    <nav
      class="nav q-electron-drag"
      :class="
        settingsStore.settings.damageMeter.design.compactDesign && !isMinimized
          ? 'compact-nav'
          : ''
      "
    >
      <span
        v-if="
          !isMinimized &&
          !settingsStore.settings.damageMeter.design.compactDesign
        "
        class="time"
      >
        {{ millisToMinutesAndSeconds(fightDuration) }}
      </span>
      <div class="info-box">
        <div
          v-if="
            !settingsStore.settings.damageMeter.design.compactDesign ||
            isMinimized
          "
        >
          LOA Details v{{ settingsStore.settings.appVersion }}
        </div>
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
          v-if="!isMinimized"
          round
          :icon="isFightPaused ? 'play_arrow' : 'pause'"
          @click="toggleFightPause"
          flat
          size="sm"
        />
        <q-btn
          round
          :icon="isMinimized ? 'add' : 'remove'"
          @click="toggleMinimizedState"
          flat
          size="sm"
        />
      </div>
    </nav>
    <div
      v-if="!isMinimized && overlayType === OverlayTypeDamages"
      class="table-wrapper"
      :style="`height: calc(100vh - 32px - ${
        settingsStore.settings.damageMeter.design.compactDesign ? '32' : '64'
      }px);`"
    >
      <table class="damage-meter-table">
        <thead class="q-electron-drag">
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
            :key="player.id"
            :player="player"
            :showTanked="damageType === DamageTypeTaken"
            :fightDuration="Math.max(1000, fightDuration)"
            @click="focusPlayer(player)"
          />
        </tbody>
      </table>
    </div>
    <div
      v-if="!isMinimized && overlayType === OverlayTypeSkills"
      class="table-wrapper"
      :style="`height: calc(100vh - 32px - ${
        settingsStore.settings.damageMeter.design.compactDesign ? '32' : '64'
      }px);`"
    >
      <table class="damage-meter-table">
        <thead class="q-electron-drag">
          <tr>
            <th style="width: 32px"></th>
            <th style="width: 100%"></th>
            <th style="width: 72px">Damage</th>
            <th style="width: 48px">D%</th>
            <th style="width: 52px">DPS</th>
            <th style="width: 44px">HITS</th>
          </tr>
        </thead>
        <tbody>
          <SkillEntry
            v-for="skill in sortedSkills"
            :key="skill.name"
            :skill="skill"
            :className="focusedPlayerClass"
            :fightDuration="Math.max(1000, fightDuration)"
            @click.right="overlayType = OverlayTypeDamages"
          />
        </tbody>
      </table>
    </div>
    <div v-if="!isMinimized" class="footer">
      <div v-if="overlayType === OverlayTypeDamages">
        <q-btn flat size="sm" @click="damageType = DamageTypeDealt">
          DMG
        </q-btn>
        <q-btn flat size="sm" @click="damageType = DamageTypeTaken">
          TANK
        </q-btn>
      </div>
      <div v-else>
        <q-btn flat size="sm" @click="overlayType = OverlayTypeDamages">
          BACK
        </q-btn>
      </div>

      <div style="margin-left: auto">
        <span v-if="settingsStore.settings.damageMeter.design.compactDesign">
          v{{ settingsStore.settings.appVersion }}
          &nbsp;&nbsp;&nbsp;&nbsp;
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
import SkillEntry from "../components/DamageMeter/SkillEntry.vue";

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
  calculateSkills();
  overlayType.value = OverlayTypeSkills;
}

const sessionDuration = ref(0);
const fightDuration = ref(0);

const isFightPaused = ref(false);
let fightPausedOn = 0,
  fightPausedForMs = 0;

function toggleFightPause() {
  if (fightDuration.value === 0) return;

  if (!isFightPaused.value) {
    fightPausedOn = +new Date();
    isFightPaused.value = true;
  } else {
    fightPausedForMs += +new Date() - fightPausedOn;
    isFightPaused.value = false;
  }
}

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
const sortedEntities = ref([]);
function sortEntities() {
  const res = sessionState.entities
    .filter(
      (entity) =>
        entity.isPlayer &&
        (damageType.value === DamageTypeDealt
          ? entity.damageDealt > 0
          : entity.damageTaken > 0)
    )
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

  const entity = sessionState.entities.find((e) => {
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

  window.messageApi.receive("pcap-on-reset-state", (value) => {
    isFightPaused.value = false;
    fightPausedOn = 0;
    fightPausedForMs = 0;
    overlayType.value = OverlayTypeDamages;
    damageType.value = DamageTypeDealt;
  });

  window.messageApi.receive("pcap-on-message", (value) => {
    if (value === "new-zone") {
      if (!isMinimized.value) {
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
      }
    } else {
      Notify.create({
        message: value,
      });
    }
  });

  setInterval(() => {
    const curTime = +new Date();

    sessionDuration.value = curTime - sessionState.startedOn;

    if (sessionState.fightStartedOn > 0) {
      if (!isFightPaused.value)
        fightDuration.value =
          curTime - sessionState.fightStartedOn - fightPausedForMs;
    } else fightDuration.value = 0;

    if (settingsStore.settings.damageMeter.functionality.autoMinimize) {
      let sendResizeMessage = false;
      const diff = curTime - sessionState.lastCombatPacket;
      if (
        !isAutoMinimized.value &&
        diff >=
          settingsStore.settings.damageMeter.functionality.autoMinimizeTimer *
            1000
      ) {
        if (!isMinimized.value) {
          // don't try to minimize if it's already
          isMinimized.value = true;
          isAutoMinimized.value = true;
          sendResizeMessage = true;
        }
      }
      if (
        isAutoMinimized.value &&
        diff <
          settingsStore.settings.damageMeter.functionality.autoMinimizeTimer *
            1000
      ) {
        if (sortedEntities.value.length > 0) {
          isMinimized.value = false;
          isAutoMinimized.value = false;
          sendResizeMessage = true;
        }
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
.compact-nav {
  height: 32px;
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
