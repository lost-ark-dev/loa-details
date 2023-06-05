<template>
  <q-layout view="lHh Lpr lFf">
    <div class="q-electron-drag app-bar">
      <div>
        <span class="gilroy-extra-bold">LOA</span>
        <span class="gilroy-light"> DETAILS </span>
        <span style="font-size: 10px; margin-left: 4px"> v{{ appVersion }} </span>
      </div>

      <q-space />

      <div class="right-bar">
        <q-btn dense flat icon="ti-minus" @click="minimize" />
        <q-btn dense flat icon="ti-control-stop" @click="toggleMaximize" />
        <q-btn dense flat icon="ti-close" @click="closeApp" />
      </div>
    </div>

    <div class="app-links q-pa-sm q-pl-md row items-center">
      <router-link v-slot="{ href, navigate }" :to="{ path: '/' }" custom>
        <div
          class="link-item q-ml-lg non-selectable"
          :class="{ active: route.path === '/' }"
          :href="href"
          @click="navigate"
        >
          <q-icon name="home" />
          Home
        </div>
      </router-link>

      <router-link v-slot="{ href, navigate }" :to="{ path: '/logs' }" custom>
        <div
          class="link-item q-ml-lg non-selectable"
          :class="{ active: route.path === '/logs' }"
          :href="href"
          @click="navigate"
        >
          <q-icon name="query_stats" />
          Logs
        </div>
      </router-link>

      <router-link v-slot="{ href, navigate }" :to="{ path: '/settings' }" custom>
        <div
          class="link-item q-ml-lg non-selectable"
          :class="{ active: route.path === '/settings' }"
          :href="href"
          @click="navigate"
        >
          <q-icon name="settings" />
          Settings
        </div>
      </router-link>

      <div
        class="link-item q-ml-lg non-selectable"
        @click="openExternal('https://github.com/lost-ark-dev/loa-details/wiki')"
      >
        <q-icon name="fa-brands fa-github" />
        Wiki
      </div>

      <div class="link-item q-ml-lg non-selectable" @click="openExternal('https://discord.gg/C3fr3EBXbS')">
        <q-icon name="fa-brands fa-discord" />
        Discord
      </div>

      <div
        class="link-item q-ml-lg non-selectable"
        style="margin-left: auto"
        @click="openExternal('https://patreon.com/Herysia')"
      >
        <q-icon name="fa-brands fa-patreon" style="color: #f1465a" />
        Support us on Patreon!
      </div>
    </div>

    <div class="q-page-container">
      <router-view />
    </div>
  </q-layout>
</template>

<script setup lang="ts">
import { appVersion, openExternal } from "src/util/ipc";
import { settings } from "stores/settings";
import { useRoute } from "vue-router";

const route = useRoute();

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
    if (settings.value.general.closeToSystemTray === false) hideToTray = false;

    if (hideToTray) window.windowControlApi.hide();
    else window.windowControlApi.close();
  }
}
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
.q-page-container {
  background: #1c2127;
}

.drawer-container {
  margin-top: 48px;
}
.drawer-container .close-button {
  margin-left: 32px;
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
  padding: 16px 32px 16px 16px;
  font-family: "gilroy light";
  font-size: 16px;
  letter-spacing: 1px;
  color: #b1d063;
  font-weight: bold;
}
.app-links .link-item:hover {
  color: #edfcb1;
  cursor: pointer;
}
.app-links .link-item.active {
  color: #fff;
}
.app-links .q-icon {
  padding-bottom: 3px;
}
</style>
