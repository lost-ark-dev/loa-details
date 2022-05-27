<template>
  <q-list>
    <q-item-label header>General</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.settings.general.startMainHidden" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Start Main Window Hidden</q-item-label>
        <q-item-label caption>
          Hides the main window (this window) to system tray on startup, only
          the damage meter will be visible.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.general.startMainMinimized"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Start Minimized</q-item-label>
        <q-item-label caption>
          Minimizes the main window (this window) on startup.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.general.closeToSystemTray"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Minimize to Tray</q-item-label>
        <q-item-label caption>
          Hitting X will send main LOA Details window to system tray instead of
          closing the app.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.settings.general.useWinpcap" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Use Winpcap</q-item-label>
        <q-item-label caption>
          Might fix packets not arriving. Program needs to be restarted after
          enabling.
        </q-item-label>
      </q-item-section>
    </q-item>

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
  </q-list>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useSettingsStore } from "../../stores/settings";
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
  settingsStore.settings.general.server = newVal.value;
});

onMounted(() => {
  serverModel.value = serverOptions.value.find(
    (x) => x.value === settingsStore.settings.general.server
  );
});
</script>
