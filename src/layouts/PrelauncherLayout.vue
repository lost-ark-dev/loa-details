<template>
  <div
    class="q-electron-drag flex column items-center justify-center prelauncher"
  >
    <img class="loader-img" :src="loaderImg" />
    <span class="loader-msg">{{ currentMessage }}</span>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const currentMessage = ref("Checking for updates...");

const loaderImg = new URL(`../assets/images/loader.gif`, import.meta.url).href;
onMounted(() => {
  window.messageApi.receive("updater-message", (eventMessage) => {
    if (eventMessage.message === "checking-for-update") {
      currentMessage.value = "Checking for updates...";
    } else if (eventMessage.message === "update-available") {
      currentMessage.value = "Found a new update! Starting download...";
    } else if (eventMessage.message === "update-not-available") {
      currentMessage.value = "Starting LOA Details...";
    } else if (eventMessage.message === "download-progress") {
      currentMessage.value = `Downloading update ${eventMessage.value.percent.toFixed(
        0
      )}%`;
    } else if (eventMessage.message === "update-downloaded") {
      currentMessage.value = "Starting updater...";
    } else if (eventMessage.message === "error") {
      currentMessage.value = "Error: " + eventMessage.value;
    }
  });
});
</script>

<style>
.prelauncher {
  width: 100%;
  height: 100vh;
}
.loader-img {
  width: 128px;
}

.loader-msg {
  text-align: center;
}
</style>
