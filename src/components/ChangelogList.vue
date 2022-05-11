<template>
  <h5 style="margin-left: 16px; margin-bottom: 0">
    Changelog (for the last 5 versions)
  </h5>
  <q-list padding>
    <q-item v-for="change in changes" :key="change.version">
      <q-item-section>
        <q-item-label overline>{{ change.version }}</q-item-label>
        <q-item-label class="changelog-md" caption>
          {{ change.mdFormattedLog }}
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { ref, onMounted } from "vue";

const changes = ref([
  {
    version: "0.2.0",
    mdFormattedLog: `
    * Updated changelog page.
    * If auto minimized, won't reopen until combat happens. Meaning it won't maximize on zone changes.
    * Can only open 1 instance of LOA Details now.
    * Added system tray.
    * Hitting X on the main window will hide it to system tray by default instead of closing the app (can be changed in Settings).
    * Added an option to hide main window to system tray at startup. This means you won't have to see
    it get minimized at startup and it also means there will be only 1 window at the dock.
    (Minimizing at startup is still an available option).
    * Now you can set auto minimizer's minimum time to 5 seconds instead of 15.
    * Fixed a bug where it would give error boxes saying 'Object has been destroyed'.
  `,
  },
  {
    version: "0.1.9",
    mdFormattedLog: `
    * Logs are now saved under "Documents\LOA Details\Logs" and they won't get deleted once you update.
    * Support for Korea and Russia clients. (This is based on main branch, I haven't tested if they work!).
    * Compact design improvements: Now shows pause button, total damage dealt and taken.
    * Fixed a bug where damage overlay got bugged if you manually minimized before auto-minimize kicked in.
    * You can now change auto minimize time (default is 60 seconds, min:15s, max:180s).
    * Now you can scroll on damage meter table.
    * Added a changelog page on the home page.
  `,
  },
  {
    version: "0.1.8",
    mdFormattedLog: `
    * Fixed a bug where it showed an error box when app was closed.
    * Added pause/resume for fights.
    * Fixed skill images with colon not appearing (wardancer skills etc..).
    * You can right click a skill to go back to damage meter display.
    * When session is reset, damage meter goes back to default (damage meter, display damage mode).
    * DPS column is now abbreviated (ex: 728,327 > 728k).
  `,
  },
  {
    version: "0.1.7",
    mdFormattedLog: `
    * Player skill damages are now relative to their max skill damage instead of total damage.
    * Skills now have skill images.
    * Player bar has an animation now.
    * New updater, finally you won't have to close the application and re-open it etc...
  `,
  },
]);
</script>

<style>
.changelog-md {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
