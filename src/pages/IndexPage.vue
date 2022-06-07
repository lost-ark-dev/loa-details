<template>
  <q-scroll-area style="height: calc(100vh - 4px - 32px - 66px)">
    <div class="changelog-page">
      <ChangelogList />
    </div>
  </q-scroll-area>
</template>

<script setup>
import ChangelogList from "src/components/ChangelogList.vue";
</script>

<style>
.changelog-page {
  padding: 0 24px;
}
</style>
