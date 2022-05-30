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
        v-if="!isMinimized"
        :class="
          settingsStore.settings.damageMeter.design.compactDesign
            ? 'time-compact'
            : 'time'
        "
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
          LOA Details
          <span v-if="!isMinimized">
            v{{ settingsStore.settings.appVersion }}
          </span>
        </div>
        <div v-if="!isMinimized && sessionState.damageStatistics">
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
          icon="fa-solid fa-ghost"
          @click="enableClickthrough"
          flat
          size="sm"
        />
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

    <DamageMeterTable
      v-if="!isMinimized && sessionState"
      :session-state="sessionState"
      :duration="fightDuration"
      :damage-type="damageType"
      :wrapper-style="`height:calc(100vh - 32px - ${
        settingsStore?.settings?.damageMeter?.design?.compactDesign
          ? '32'
          : '64'
      }px)`"
    />

    <footer v-if="!isMinimized" class="footer">
      <div>
        <q-btn flat size="sm" @click="damageType = 'dmg'"> DMG </q-btn>
        <q-btn flat size="sm" @click="damageType = 'tank'"> TANK </q-btn>
        <!-- <q-btn flat size="sm" @click="damageType = 'heal'"> HEAL </q-btn> -->
      </div>

      <div style="margin-left: auto">
        <span v-if="settingsStore.settings.damageMeter.design.compactDesign">
          v{{ settingsStore.settings.appVersion }}
        </span>
        <q-btn flat size="sm" @click="requestSessionRestart">
          RESET SESSION
        </q-btn>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { Notify } from "quasar";
import {
  numberFormat,
  millisToMinutesAndSeconds,
} from "src/util/number-helpers";
import { useSettingsStore } from "src/stores/settings";

import DamageMeterTable from "src/components/DamageMeter/DamageMeterTable.vue";

const settingsStore = useSettingsStore();

const isMinimized = ref(false);
const isAutoMinimized = ref(false);
const damageType = ref("dmg");

function toggleMinimizedState() {
  isMinimized.value = !isMinimized.value;

  window.messageApi.send("window-to-main", {
    message: "toggle-damage-meter-minimized-state",
    value: isMinimized.value,
  });
}

function enableClickthrough() {
  window.windowControlApi.setIgnoreMouseEvents(true);
  Notify.create({
    message:
      "<center>ALT+TAB back to the damage meter window to disable clickthrough.</center>",
    color: "primary",
    html: true,
  });
}

const sessionDuration = ref(0);
const fightDuration = ref(0);

const isFightPaused = ref(false);
let fightPausedOn = 0;
let fightPausedForMs = 0;

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

function requestSessionRestart() {
  window.messageApi.send("window-to-main", { message: "reset-session" });
}

const sessionState = ref({});

onMounted(() => {
  settingsStore.initSettings();

  window.messageApi.receive("on-settings-change", (value) => {
    settingsStore.loadSettings(value);
  });

  window.messageApi.send("window-to-main", { message: "get-settings" });

  window.messageApi.receive("pcap-on-state-change", (value) => {
    sessionState.value = value;
  });

  window.messageApi.receive("pcap-on-reset-state", (value) => {
    isFightPaused.value = false;
    fightPausedOn = 0;
    fightPausedForMs = 0;
    damageType.value = "dmg";
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
    } else if (value === "raid-end") {
      if (!isFightPaused.value) toggleFightPause();
      if (!isMinimized.value) {
        Notify.create({
          message: "Encounter ended, paused the session.",
          color: "primary",
        });
      }
    } else if (typeof value === "object" && value.name === "session-upload") {
      if (value.failed) {
        Notify.create({
          message: value.message,
          color: "red",
        });
      } else {
        Notify.create({
          message: value.message,
          color: "primary",
        });
      }
    } else {
      Notify.create({
        message: value,
      });
    }
  });

  setInterval(() => {
    if (Object.keys(sessionState.value).length <= 0) return;

    const curTime = +new Date();

    sessionDuration.value = curTime - sessionState.value.startedOn;

    if (sessionState.value.fightStartedOn > 0) {
      if (!isFightPaused.value)
        fightDuration.value =
          curTime - sessionState.value.fightStartedOn - fightPausedForMs;
    } else fightDuration.value = 0;

    if (settingsStore.settings.damageMeter.functionality.autoMinimize) {
      let sendResizeMessage = false;
      const diff = curTime - sessionState.value.lastCombatPacket;
      if (
        !isAutoMinimized.value &&
        diff >=
          settingsStore.settings.damageMeter.functionality.autoMinimizeTimer *
            1000
      ) {
        if (!isMinimized.value) {
          // don't try to minimize if it's already minimized
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
.compact-nav .time-compact,
.compact-nav .info-box {
  margin-top: 2px;
}
.nav .time-compact {
  font-size: 11px;
  color: #fff;
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
</style>
