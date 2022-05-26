<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-bar class="q-electron-drag">
        <div>LOA Details v{{ settingsStore.settings.appVersion }}</div>

        <q-space />

        <q-btn dense flat icon="minimize" @click="minimize" />
        <q-btn dense flat icon="crop_square" @click="toggleMaximize" />
        <q-btn dense flat icon="close" @click="closeApp" />
      </q-bar>

      <div class="q-pa-sm q-pl-md row items-center">
        <router-link :to="{ path: '/' }" custom v-slot="{ href, navigate }">
          <div
            class="cursor-pointer non-selectable"
            :href="href"
            @click="navigate"
          >
            Home
          </div>
        </router-link>

        <router-link :to="{ path: '/logs' }" custom v-slot="{ href, navigate }">
          <div
            class="q-ml-md cursor-pointer non-selectable"
            :href="href"
            @click="navigate"
          >
            Logs
          </div>
        </router-link>

        <router-link
          :to="{ path: '/settings' }"
          custom
          v-slot="{ href, navigate }"
        >
          <div
            class="q-ml-md cursor-pointer non-selectable"
            :href="href"
            @click="navigate"
          >
            Settings
          </div>
        </router-link>
        <div class="q-ml-md cursor-pointer non-selectable" @click="openDiscord">
          <q-icon name="fa-brands fa-discord" />
          &nbsp;Discord
          <q-badge color="red" transparent>NEW</q-badge>
        </div>
        <div
          class="q-ml-md cursor-pointer non-selectable"
          style="margin-left: auto"
          @click="updateButton"
        >
          {{ updateButtonText }}
        </div>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useSettingsStore } from "../stores/settings";
const settingsStore = useSettingsStore();

function minimize() {
  if (process.env.MODE === "electron") {
    window.windowControlApi.minimize();
  }
}

function toggleMaximize() {
  if (process.env.MODE === "electron") {
    window.windowControlApi.toggleMaximize();
  }
}

function closeApp() {
  if (process.env.MODE === "electron") {
    let hideToTray = true; // On by default
    if (settingsStore?.settings?.general?.closeToSystemTray === false)
      hideToTray = false;

    if (hideToTray) window.windowControlApi.hide();
    else window.windowControlApi.close();
  }
}

function openDiscord() {
  window.messageApi.send("window-to-main", {
    message: "open-link",
    value: "https://discord.gg/yQmN76dnud",
  });
}

const isUpdateAvailable = ref(false);
const updateButtonText = ref("Check for Updates");
function updateButton() {
  if (!isUpdateAvailable.value) {
    window.messageApi.send("window-to-main", {
      message: "check-for-updates",
    });
  } else {
    window.messageApi.send("window-to-main", {
      message: "quit-and-install",
    });
  }
}

onMounted(() => {
  settingsStore.initSettings();

  window.messageApi.receive("on-settings-change", (value) => {
    settingsStore.loadSettings(value);
  });

  window.messageApi.receive("updater-message", (eventMessage) => {
    if (eventMessage.message === "checking-for-update") {
      updateButtonText.value = "Checking for updates...";
    } else if (eventMessage.message === "update-available") {
      updateButtonText.value = "Found a new update! Starting download...";
    } else if (eventMessage.message === "update-not-available") {
      updateButtonText.value = "No Update";
      setTimeout(() => {
        updateButtonText.value = "Check for Updates";
      }, 3000);
    } else if (eventMessage.message === "download-progress") {
      updateButtonText.value = `Downloading update ${eventMessage.value.percent.toFixed(
        0
      )}%`;
    } else if (eventMessage.message === "update-downloaded") {
      updateButtonText.value = "Install New Update";
      isUpdateAvailable.value = true;
    } else if (eventMessage.message === "error") {
      updateButtonText.value = "Error: " + eventMessage.value;
    }
  });

  setInterval(() => {
    if (!isUpdateAvailable.value) {
      window.messageApi.send("window-to-main", {
        message: "check-for-updates",
      });
    }
  }, 60000);

  window.messageApi.send("window-to-main", { message: "get-settings" });
});
</script>
