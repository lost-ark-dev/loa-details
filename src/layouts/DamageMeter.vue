<template>
  <div ref="damageMeterRef">
    <nav
      class="nav q-electron-drag"
      :class="
        settingsStore.settings.damageMeter.design.compactDesign &&
        !isMinimized &&
        !isTakingScreenshot
          ? 'compact-nav'
          : ''
      "
    >
      <span
        v-if="!isMinimized"
        :class="
          settingsStore.settings.damageMeter.design.compactDesign &&
          !isTakingScreenshot
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
            isMinimized ||
            isTakingScreenshot
          "
        >
          LOA Details
          <span v-if="!isMinimized">
            v{{ settingsStore.settings.appVersion }}
          </span>
        </div>
        <div
          v-if="!isMinimized && sessionState.damageStatistics"
          class="q-electron-drag--exception"
        >
          <q-menu touch-position context-menu>
            <q-list dense style="min-width: 100px">
              <q-item
                v-for="tabName in Object.keys(
                  settingsStore.settings.damageMeter.header
                )"
                :key="tabName"
                clickable
                @click="toggleHeaderDisplay(tabName)"
              >
                <q-item-section side>
                  <q-icon
                    v-if="
                      settingsStore.settings.damageMeter.header[tabName].enabled
                    "
                    name="check"
                  />
                  <q-icon v-else name="close" />
                </q-item-section>
                <q-item-section>
                  {{ settingsStore.settings.damageMeter.header[tabName].name }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <span
            v-if="settingsStore.settings.damageMeter.header.damage.enabled"
            style="margin-right: 12px"
          >
            Total DMG
            {{ numberFormat(sessionState.damageStatistics.totalDamageDealt) }}
          </span>
          <span
            v-if="settingsStore.settings.damageMeter.header.dps.enabled"
            style="margin-right: 12px"
          >
            Total DPS
            {{ numberFormat(sessionDPS) }}
          </span>
          <span
            v-if="settingsStore.settings.damageMeter.header.tank.enabled"
            style="margin-right: 12px"
          >
            Total TNK
            {{ numberFormat(sessionState.damageStatistics.totalDamageTaken) }}
          </span>
        </div>
      </div>
      <div v-if="!isTakingScreenshot" style="margin-left: auto">
        <q-btn
          v-if="!isMinimized"
          round
          icon="screenshot_monitor"
          @click="takeScreenshot"
          flat
          size="sm"
        >
          <q-tooltip> Take a screenshot of the damage meter </q-tooltip>
        </q-btn>
        <q-btn
          v-if="!isMinimized"
          round
          icon="fa-solid fa-ghost"
          @click="enableClickthrough"
          flat
          size="sm"
        >
          <q-tooltip ref="clickthroughTooltip">
            Enable clickthrough on damage meter
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="!isMinimized"
          round
          :icon="isFightPaused ? 'play_arrow' : 'pause'"
          @click="toggleFightPause"
          flat
          size="sm"
        >
          <q-tooltip> Pause timer </q-tooltip>
        </q-btn>
        <q-btn
          round
          :icon="isMinimized ? 'add' : 'remove'"
          @click="toggleMinimizedState"
          flat
          size="sm"
        >
          <q-tooltip> Minimize damage meter </q-tooltip>
        </q-btn>
      </div>
      <span v-else class="watermark-box">
        <img class="watermark-logo" :src="logoImg" />
        github.com/karaeren/loa-details
      </span>
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
      :name-display="
        settingsStore?.settings?.damageMeter?.functionality?.nameDisplayV2
      "
    />

    <footer v-if="!isMinimized" class="footer">
      <div>
        <q-btn flat size="sm" @click="damageType = 'dmg'" label="DMG">
          <q-tooltip> Show damage </q-tooltip>
        </q-btn>
        <q-btn flat size="sm" @click="damageType = 'tank'" label="TANK">
          <q-tooltip> Show damage taken </q-tooltip>
        </q-btn>
        <q-btn flat size="sm" @click="damageType = 'heal'" label="HEAL">
          <q-tooltip> Show healing done </q-tooltip>
        </q-btn>
        <q-btn flat size="sm" @click="damageType = 'shield'" label="SHIELD">
          <q-tooltip> Show shield done </q-tooltip>
        </q-btn>
      </div>

      <div style="margin-left: auto">
        <span
          v-if="
            settingsStore.settings.damageMeter.design.compactDesign &&
            !isTakingScreenshot
          "
        >
          v{{ settingsStore.settings.appVersion }}
        </span>
        <q-btn
          flat
          size="sm"
          @click="requestSessionRestart"
          label="RESET SESSION"
        >
          <q-tooltip> Resets the timer and damages </q-tooltip>
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
  abbreviateNumber,
} from "src/util/number-helpers";
import { sleep } from "src/util/sleep";
import html2canvas from "html2canvas";

import { useSettingsStore } from "src/stores/settings";

import DamageMeterTable from "src/components/DamageMeter/DamageMeterTable.vue";

const logoImg = new URL(`../assets/images/logo.png`, import.meta.url).href;

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

const clickthroughTooltip = ref(null);
function enableClickthrough() {
  window.windowControlApi.setIgnoreMouseEvents(true);

  if (clickthroughTooltip.value) {
    clickthroughTooltip.value.hide();
  }

  Notify.create({
    message:
      "<center>ALT+TAB back to the damage meter window to disable clickthrough.</center>",
    color: "primary",
    html: true,
  });
}

function toggleHeaderDisplay(tabName) {
  settingsStore.settings.damageMeter.header[tabName].enabled =
    !settingsStore.settings.damageMeter.header[tabName].enabled;

  window.messageApi.send("window-to-main", {
    message: "save-settings",
    value: JSON.stringify(settingsStore.settings),
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

const damageMeterRef = ref(null);
const isTakingScreenshot = ref(false);
async function takeScreenshot() {
  isTakingScreenshot.value = true;
  await sleep(600);

  const screenshot = await html2canvas(damageMeterRef.value, {
    backgroundColor: "#121212",
  });

  screenshot.toBlob(
    (blob) => {
      navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    },
    "image/png",
    1
  );

  if (settingsStore.settings.general.saveScreenshots) {
    window.messageApi.send("window-to-main", {
      message: "save-screenshot",
      value: screenshot.toDataURL(),
    });
  }

  isTakingScreenshot.value = false;
  Notify.create({
    message: "<center>Screenshot copied to clipboard.</center>",
    color: "primary",
    html: true,
  });
}

function requestSessionRestart() {
  window.messageApi.send("window-to-main", { message: "reset-session" });
}

const sessionState = ref({});
const sessionDPS = ref(0);

onMounted(() => {
  settingsStore.initSettings();

  window.messageApi.receive("shortcut-action", (value) => {
    if (value === "toggle-minimized-state") toggleMinimizedState();
    else if (value === "reset-session") requestSessionRestart();
    else if (value === "pause-damage-meter") toggleFightPause();
  });

  window.messageApi.receive("on-settings-change", (value) => {
    settingsStore.loadSettings(value);
  });

  window.messageApi.send("window-to-main", { message: "get-settings" });

  window.messageApi.receive("pcap-on-state-change", (value) => {
    sessionState.value = value;

    if (
      sessionState.value.damageStatistics?.totalDamageDealt &&
      fightDuration.value > 0
    )
      sessionDPS.value = (
        sessionState.value.damageStatistics.totalDamageDealt /
        (fightDuration.value / 1000)
      ).toFixed(0);
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
    } else if (value.startsWith("phase-transition")) {
      // phase-transition-0: raid over
      // phase-transition-1: boss dead, includes argos phases
      // phase-transition-2: wipe

      if (
        value === "phase-transition-0" ||
        value === "phase-transition-1" ||
        value === "phase-transition-2"
      ) {
        if (
          settingsStore.settings.damageMeter.functionality
            .pauseOnPhaseTransition &&
          !isFightPaused.value
        ) {
          toggleFightPause();

          let pauseReason = "Raid Over";
          if (value === "phase-transition-1") {
            pauseReason = "Boss Dead";
          } else if (value === "phase-transition-2") {
            pauseReason = "Wipe/Phase Clear";
          }

          if (!isMinimized.value) {
            Notify.create({
              message: `Paused the session (${pauseReason}).`,
              color: "primary",
            });
          }
        }
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

  window.messageApi.receive("on-restore-from-taskbar", (value) => {
    if (value) isMinimized.value = false;
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
.watermark-box {
  margin-left: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 4px;
}
.watermark-logo {
  width: 112px;
}
</style>
