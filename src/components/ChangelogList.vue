<template>
  <h5 style="margin-left: 16px; margin-bottom: 0">Changelog</h5>
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
import { ref } from "vue";

const changes = ref([
  {
    version: "0.4.1",
    mdFormattedLog: `
    * Added item levels of players next to their names.
    * Added an option to disable damage column in the damage meter and log viewer.
  `,
  },
  {
    version: "0.4.0",
    mdFormattedLog: `
    * Left clicking Mokoko icon on the tray now displays main window.
    * Screenshots are now saved to Documents/Lost Ark Logs/screenshots (can be disabled through Settings).
    * Fixed a bug where logo was not being displayed on the screenshot properly when compact design mode was enabled.
    * Fixed a bug where the clickthrough button tooltip would get stuck on the damage meter.
  `,
  },
  {
    version: "0.3.7",
    mdFormattedLog: `
    * Fixed a bug where auto minimize was not working.
    * Added a indicator message on the logs page when there weren't any parseable logs.
    * Bugfix about clock where it would sometimes display 0:60 instead of 1:00.
    * Added a dropdown menu to log viewer screenshot button to not censor names.
    * Added a screenshot button to damage meter.
    * Added an option to customize name displays on damage meter, now you can do name/name+class/class/empty for player names.
    * Added tooltips for buttons on the damage meter.
  `,
  },
  {
    version: "0.3.6",
    mdFormattedLog: `
    * Added encounter name to log viewer.
    * Added context menu to damage meter and log viewer table headers. Now you can right click to enable/disable specific tabs without going to settings menu.
  `,
  },
  {
    version: "0.3.5",
    mdFormattedLog: `
    * Added duration to log viewer.
    * Fixed a bug with the damage meter scrollbar.
    * Fixed an issue where LostArkLogger would crash if it couldn't send messages.
    * Added MaxDmg to skill view bar.
    * Added a button on log viewer to take a screenshot of the current log.
  `,
  },
  {
    version: "0.3.4",
    mdFormattedLog: `
    * Refactored a lot of UI code about the damage meter.
    * Added DMG/TANK buttons to log viewer.
    * Updated damage meter compact design.
    * Hid encounters that are less than 1 seconds on the log viewer.
    * Fixed a bug with the windows not remembering their last position.
  `,
  },
  {
    version: "0.3.1",
    mdFormattedLog: `
    * Added an option in settings to auto pause on wipes/phase changes/(guardian) boss deaths
    * Added an option to remove overkill damage
    * Added an option to change the opacity of damage meter (default is 0.9 meaning 90%).
    * Added a log settings page, moved "minimum fight duration" setting to there and it's saved now.
    * Added an option to log settings to create an encounter on phase transition. With this setting, each Valtan wipe etc... will be seen as a single encounter on logs page.
    * Added a "wipe parsed logs" button to the logs settings page.
    * Made the log parsing asnychronous and added a progress bar. Now the window won't get frozen and you'll be able to see the parsing progression.

    Thanks to guy0090@Github for adding most of these changes.
  `,
  },
  {
    version: "0.3.0",
    mdFormattedLog: `
    * Fixed a bug with auto updater.
    * Fixed a bug with windows that caused error boxes to appear when trying to quit.
  `,
  },
  {
    version: "0.2.9",
    mdFormattedLog: `
    * Added an option to check for updates on the main window. It also automatically checks for update once every hour now.
    * Added a stylized mokoko icon.
    * Refactored a lot of code.
    * Now it remembers the size and position of the main window as well.
    * Added a security feature to only accept packets from localhost.
    * Updated LostArKLogger. The logging system has changed a lot which also opened doors for new possibilites that'll come in the future releases.
    * Log folder has moved into "Documents/Lost Ark Logs" from of "Documents/LOA Details/Logs". The logging system has also changed which made old logs incompatible. You can delete the "LOA Details" folder in your documents if you'd like.
    * Added a "Open Folder" button to logs page.
    * Now each encounter is listed on the log page instead of each session. Also added "Encounter Duration" to logs page.
    * Added a slider to filter out logs under X minutes.
  `,
  },
  {
    version: "0.2.8",
    mdFormattedLog: `
    * Added exception handling when parsing log files to fix crashes when viewing Log page.
    * Added "Maximum Hits" column to skill view on both damage meter and log viewer. Also changed "Total" column name to "Total Hits" to remove confusion.
    * Fixed a bug where it would show "Inf%" on Damage percentage column. Also temporarily "fixed" a bug where it would register Bleed attacks with really high damage numbers.
    * Added a clickthrough functionality. Now you can click the "Ghost" icon on damage meter and it will be click through. To be able to click at it again, ALT+TAB into the damage meter window.
  `,
  },
  {
    version: "0.2.7",
    mdFormattedLog: `
    * "TOTAL" column added to skill view on damage meter and log view. It displays the amount of times the skill is used.
    * Logger now correctly separates log files based on sessions (zones).
    * Logger now displays correct crit rate.
    * Log pages now filters out logs that are less than 8 KB in size.
    * Added encounter names and encounter filters to the log page.
    * Logs page now remembers the page of the table when you click "Back" on a log view.
  `,
  },
  {
    version: "0.2.6",
    mdFormattedLog: `
    * Changed communication method of the packet capturer and electron app from stdin/out to http server.
    * Fixed an issue where the logger was crashing during loading screens.
  `,
  },
  {
    version: "0.2.5",
    mdFormattedLog: `
    * Updated LostArkLogger to fix some bugs.
    * You can now visualize your logs on the log viewer and sort by encounters! This also means you can visualize your old logs prior to this update.
    * When viewing skill data of a player, you can now view special attack rates such as crit rate, front attack rate etc... per skill.
  `,
  },
  {
    version: "0.2.4",
    mdFormattedLog: `
    * Updated LostArkLogger so it works after the new patch.
    - This also means player names appear correctly once again.
    * Fixed a bug with the logger that resulted in packets not being captured after zone change.
    * Added a Patreon page in case you want to support the development of LOA Details (not related to the main project).
  `,
  },
  {
    version: "0.2.3",
    mdFormattedLog: `
    * Fixed a typo with the log folder structure that resulted in crashes.
    * Creating missing log folders now.
  `,
  },
  {
    version: "0.2.1",
    mdFormattedLog: `
    * Updated LostArkLogger to work after the maintenance patch.
  `,
  },
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
]);
</script>

<style>
.changelog-md {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
