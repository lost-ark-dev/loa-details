<template>
  <q-page class="flex justify-start column">
    <q-scroll-area style="height: calc(100vh - 80px); padding: 8px 16px">
      <ChangelogList />
    </q-scroll-area>
  </q-page>
</template>

<script setup>
import ChangelogList from "src/components/ChangelogList.vue";
</script>
