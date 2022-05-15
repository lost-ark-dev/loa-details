<template>
  <div class="flex column items-center justify-center prelauncher">
    <img class="loader-img" :src="loaderImg" />
    <span class="loader-msg">{{ currentMessage }}</span>
    <div v-if="error">
      <br>
      <span class="ellipsis">{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

const currentMessage = ref("LOA Details");
const errorMessage = ref("");
const error= ref(false);

const loaderImg = new URL(`../assets/images/loader.gif`, import.meta.url).href;
onMounted(() => {
  window.messageApi.receive("prelauncher-message", (value) => {
    if (typeof value === 'object') {
      if (value.error) {
        error.value = true;
        errorMessage.value = value.error.reason;
        currentMessage.value = value.error.message
      } else {
        currentMessage.value = value.message;
      }
    } else {
      currentMessage.value = value;
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
