<template>
  <q-list>
    <q-item-label header>General</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.general.startMainHidden" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Start Main Window Hidden</q-item-label>
        <q-item-label caption>
          Hides the main window (this window) to system tray on startup, only the damage meter will be visible.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.general.startMainMinimized" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Start Minimized</q-item-label>
        <q-item-label caption> Minimizes the main window (this window) on startup. </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.general.closeToSystemTray" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Minimize to Tray</q-item-label>
        <q-item-label caption>
          Hitting X will send main LOA Details window to system tray instead of closing the app.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.general.saveScreenshots" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Save Screenshots</q-item-label>
        <q-item-label caption> If enabled, the screenshots taken in LOA Details will be saved as a file. </q-item-label>
      </q-item-section>
    </q-item>
    <q-item-label header>Network</q-item-label>
    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.general.useRawSocket" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Raw Socket (Require Administrator)</q-item-label>
        <q-item-label caption>
          Switch from Npcap listening to Raw socket mode. Recommended if you are having trouble with npcap (especially
          VPN users). Require restart.
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item tag="label">
      <q-item-section side top>
        <q-input
          v-model.number="settingsStore.general.listenPort"
          type="number"
          filled
          :dense="true"
          style="max-width: 100px"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Listen port</q-item-label>
        <q-item-label caption
          >Override listening port, used for proxy users (socks5 supported). You must be sure only game traffic goes
          through the proxy. Require restart.
        </q-item-label>
      </q-item-section>
    </q-item>
    <!--
    <q-item tag="label">
      <q-item-section side top>
        <q-item-label>Game Region</q-item-label>
        <q-item-label caption>
          Select the region you're playing on. Program needs to be restarted
          after changing.
        </q-item-label>
      </q-item-section>
      <q-item-section>
        <q-select filled v-model="serverModel" :options="serverOptions" />
      </q-item-section>
    </q-item>
    -->
    <q-item tag="label">
      <q-item-section>
        <q-item-label>Custom Log Path</q-item-label>
        <q-item-label caption style="margin-bottom: 16px">
          You can select a custom log path to save logs to (instead of the default path in Documents folder). Program
          needs to be restarted to take effect.
        </q-item-label>
        <div>
          <q-btn
            unelevated
            color="orange"
            label="Select a Custom Path"
            style="margin-right: 16px"
            @click="selectCustomLogPath"
          />
          <q-btn unelevated color="blue" label="Reset Custom Path" @click="resetLogPath" />
          <div style="margin-top: 16px">Current path: {{ currentLogPath }}</div>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

const serverOptions = ref([
  {
    label: "Steam (EU/NA/SA)",
    value: "steam",
  },
  {
    label: "Russia",
    value: "russia",
  },
  {
    label: "Korea",
    value: "korea",
  },
]);
var serverModel = ref("");
watch(serverModel, (newVal, oldVal) => {
  settingsStore.general.server = newVal.value;
});

const currentLogPath = ref("");
function selectCustomLogPath() {
  window.messageApi.send("window-to-main", {
    message: "select-log-path-folder",
  });
}
function resetLogPath() {
  settingsStore.general.customLogPath = null;
  currentLogPath.value = "Documents/Lost Ark Logs (needs restart)";
}

onMounted(() => {
  window.messageApi.receive("selected-log-path-folder", (newPath) => {
    settingsStore.general.customLogPath = newPath;
    currentLogPath.value = newPath + " (needs restart)";
  });

  serverModel.value = serverOptions.value.find((x) => x.value === settingsStore.general.server);

  if (settingsStore.general.customLogPath === null) currentLogPath.value = "Documents/Lost Ark Logs";
  else currentLogPath.value = settingsStore.general.customLogPath;
});
</script>
