<template>
  <div class="flex column items-center justify-center prelauncher">
    <img class="loader-img" :src="loaderImg" />
    <span>{{ currentMessage }}</span>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const currentMessage = ref("LOA Details");

const loaderImg = new URL(`../assets/images/loader.gif`, import.meta.url).href;
onMounted(() => {
  window.messageApi.receive("updater-message", (value) => {
    currentMessage.value = value;
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
</style>
