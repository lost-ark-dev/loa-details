<template>
  <q-layout view="lHh Lpr lFf" style="min-height: calc(100vh - 16px)">
    <div v-if="drawerLeft" class="drawer-background"></div>
    <q-drawer
      v-model="drawerLeft"
      overlay
      bordered
      :width="300"
      class="text-white"
      :no-swipe-backdrop="true"
    >
      <q-scroll-area class="fit">
        <div class="drawer-container">
          <q-btn
            @click="drawerLeft = !drawerLeft"
            class="close-button"
            flat
            round
            dense
            icon="close"
            style="margin-bottom: 16px"
          />

          <router-link :to="{ path: '/' }" custom v-slot="{ href, navigate }">
            <div class="drawer-item" :href="href" @click="navigate">
              <q-icon name="home" />
              Home
            </div>
          </router-link>

          <router-link
            :to="{ path: '/logs' }"
            custom
            v-slot="{ href, navigate }"
          >
            <div class="drawer-item" :href="href" @click="navigate">
              <q-icon name="timeline" />
              Logs
            </div>
          </router-link>

          <router-link
            :to="{ path: '/settings' }"
            custom
            v-slot="{ href, navigate }"
          >
            <div class="drawer-item" :href="href" @click="navigate">
              <q-icon name="settings" />
              Settings
            </div>
          </router-link>
        </div>
      </q-scroll-area>
    </q-drawer>

    <div class="q-electron-drag app-bar">
      <div>
        <span class="gilroy-extra-bold">LOA</span>
        <span class="gilroy-light"> DETAILS </span>
        <span style="font-size: 10px; margin-left: 4px">
          v{{ settingsStore.settings.appVersion }}
        </span>
      </div>

      <q-space />

      <div class="right-bar">
        <q-btn dense flat icon="ti-minus" @click="minimize" />
        <q-btn dense flat icon="ti-control-stop" @click="toggleMaximize" />
        <q-btn dense flat icon="ti-close" @click="closeApp" />
      </div>
    </div>

    <div class="app-links q-pa-sm q-pl-md row items-center">
      <q-btn
        @click="drawerLeft = !drawerLeft"
        class="link-item"
        flat
        round
        dense
        icon="menu"
      />

      <router-link :to="{ path: '/' }" custom v-slot="{ href, navigate }">
        <div
          class="link-item q-ml-lg non-selectable"
          :class="{ active: route.path === '/' }"
          :href="href"
          @click="navigate"
        >
          Home
        </div>
      </router-link>

      <router-link :to="{ path: '/logs' }" custom v-slot="{ href, navigate }">
        <div
          class="link-item q-ml-lg non-selectable"
          :class="{ active: route.path === '/logs' }"
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
          class="link-item q-ml-lg non-selectable"
          :class="{ active: route.path === '/settings' }"
          :href="href"
          @click="navigate"
        >
          Settings
        </div>
      </router-link>

      <div class="link-item q-ml-lg non-selectable" @click="openDiscord">
        <q-icon name="fa-brands fa-discord" />
        Discord
      </div>

      <div
        class="link-item non-selectable"
        style="margin-left: auto"
        @click="updateButton"
      >
        {{ updateButtonText }}
      </div>
    </div>

    <div class="q-page-container">
      <router-view />
    </div>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useSettingsStore } from "src/stores/settings";
import { useRoute } from "vue-router";

const settingsStore = useSettingsStore();

const route = useRoute();
const drawerLeft = ref(false);

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

<style>
.drawer-background {
  z-index: 2000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #111519b3;
}
.q-page-container,
.q-drawer {
  background: #1c2127;
}

.drawer-container {
  margin-top: 48px;
}
.drawer-container .close-button {
  margin-left: 32px;
}
.drawer-item .q-icon {
  font-size: 18px;
  color: #777a7d;
  margin-right: 8px;
}
.drawer-item {
  padding: 8px;
  padding-left: 32px;
  color: #fff;
  font-size: 14px;
  font-family: "questrial";
  cursor: default;
}
.drawer-item:hover {
  background-color: #8fa66d;
}
.drawer-item:hover .q-icon {
  color: #fff;
}

.app-bar {
  display: flex;
  font-size: 16px;
  align-items: center;
  padding: 0 12px;
  padding-top: 1px;
  justify-content: space-between;
  background: #121519;
  color: #a0a1a3;
  height: 32px;
}

.app-bar .q-btn {
  color: #898a8c;
  font-size: 10px;
}
.app-bar .q-btn:hover {
  color: #fff;
}
.app-bar .q-btn .q-focus-helper {
  opacity: 0 !important;
}
.app-bar .right-bar {
  display: flex;
  align-items: center;
  justify-content: center;
}
.app-bar .right-bar .q-btn {
  margin-left: 8px;
}
.app-links {
  background: #161a1f;
  padding: 16px 32px;
  font-family: "gilroy light";
  font-size: 16px;
  letter-spacing: 1px;
  color: #b1d063;
  font-weight: bold;
}
.app-links .link-item:hover {
  color: #edfcb1;
}
.app-links .link-item.active {
  color: #fff;
}
</style>
