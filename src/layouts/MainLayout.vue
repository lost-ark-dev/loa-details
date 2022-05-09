<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-bar class="q-electron-drag">
        <div>Lost Ark Details - v0.1.4</div>

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
            <q-badge color="red" transparent>NEW</q-badge>
          </div>
        </router-link>
      </div>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted } from "vue";
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
    window.windowControlApi.close();
  }
}

let firstSettingsReceive = true;
onMounted(() => {
  settingsStore.initSettings();

  window.messageApi.receive("on-settings-change", (value) => {
    settingsStore.loadSettings(value);
    if (firstSettingsReceive) {
      firstSettingsReceive = false;
      if (settingsStore.settings.general.startMainMinimized) {
        window.messageApi.send("window-to-main", {
          message: "minimize-main-window",
        });
      }
    }
  });

  window.messageApi.send("window-to-main", { message: "get-settings" });
});
</script>
