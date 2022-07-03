<template>
  <q-scroll-area style="height: calc(100vh - 4px - 32px - 66px)">
    <div class="changelog-page">
      <h5 style="margin-left: 16px; margin-bottom: 0">About</h5>
      <p style="margin-left: 16px; margin-top: 16px" class="text-body1">
        LOA Details allows you to track real-time stats of the game Lost Ark and
        view and parse its logged data.
        <br />
        <br />
        It relies on the logging capabilities of the open-source software
        <a
          @click="
            openLinkInBrowser('https://github.com/shalzuth/LostArkLogger')
          "
          class="custom-link"
          >LostArkLogger</a
        >
        and the modified version of the logger's source code can be found
        <a
          @click="
            openLinkInBrowser('https://github.com/karaeren/LostArkLogger')
          "
          class="custom-link"
          >here</a
        >.
      </p>

      <ChangelogList />
    </div>
  </q-scroll-area>
</template>

<script setup>
import ChangelogList from "src/components/ChangelogList.vue";

function openLinkInBrowser(link) {
  window.messageApi.send("window-to-main", {
    message: "open-link",
    value: link,
  });
}
</script>

<style>
.changelog-page {
  padding: 0 24px;
}
.custom-link {
  text-decoration: underline;
  color: #00bcd4;
  cursor: pointer;
}
</style>
