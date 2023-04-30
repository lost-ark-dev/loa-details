<template>
  <q-scroll-area style="height: calc(100vh - 4px - 32px - 66px)">
    <div class="changelog-page">
      <h5 style="margin-left: 16px; margin-bottom: 0">About</h5>
      <p style="margin-left: 16px; margin-top: 16px" class="text-body1">
        LOA Details allows you to track real-time stats of the game Lost Ark and view and parse its logged data.
        <br />
        <br />
        This app is a clone from the
        <a @click="openLinkInBrowser('https://github.com/karaeren/loa-details')" class="custom-link"
          >original interface</a
        >
        from
        <a @click="openLinkInBrowser('https://github.com/karaeren')" class="custom-link">karaeren</a>
        It has been modified to work as a standalone program, without the need of any 3rd party logger. The packet
        sniffing part has been made from scratch by
        <a @click="openLinkInBrowser('https://github.com/Herysia')" class="custom-link">Herysia</a>
        and
        <a @click="openLinkInBrowser('https://github.com/Mathicha')" class="custom-link">Mathi</a>, however, we can't
        help but thank
        <a @click="openLinkInBrowser('https://github.com/Shalzuth')" class="custom-link">Shalzuth</a>
        for his work on
        <a @click="openLinkInBrowser('https://github.com//shalzuth/LostArkLogger')" class="custom-link">LostArkLogger</a
        >.
      </p>

      <p style="margin-left: 16px; margin-top: 16px" class="text-body1">
        Refer to the
        <a class="custom-link" @click="openLinkInBrowser('https://discord.gg/C3fr3EBXbS')"> Discord Server</a>
        for full change log.
      </p>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
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
