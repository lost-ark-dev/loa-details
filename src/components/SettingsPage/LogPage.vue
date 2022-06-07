<template>
  <q-list>
    <q-item-label header>General</q-item-label>
    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.logs.splitOnPhaseTransition"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Split on phase transition</q-item-label>
        <q-item-label caption>
          If enabled, it will create another "encounter" on phase transitions (a
          new phase begins/ends or when the raid wipes).
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item-label header>Minimum Session Duration (in minutes)</q-item-label>
    <q-item>
      <q-item-section side>
        <q-icon name="access_time" />
      </q-item-section>
      <q-item-section>
        <q-slider
          style="margin: 0 16px"
          :model-value="
            settingsStore.settings.logs.minimumSessionDurationInMinutes
          "
          @change="
            (val) => {
              settingsStore.settings.logs.minimumSessionDurationInMinutes = val;
            }
          "
          color="primary"
          label-always
          switch-label-side
          :label-value="`Minimum ${settingsStore.settings.logs.minimumSessionDurationInMinutes} minute(s)`"
          markers
          marker-labels
          :min="0"
          :max="10"
          :step="1"
        >
          <template v-slot:marker-label-group="scope">
            <div
              v-for="marker in scope.markerList"
              :key="marker.index"
              :class="[
                `text-blue-${2 + Math.ceil(marker.value / 2)}`,
                marker.classes,
              ]"
              :style="marker.style"
              @click="model = marker.value"
            >
              {{ marker.value }}
            </div>
          </template>
        </q-slider>
      </q-item-section>
    </q-item>

    <q-item-label header>Minimum Encounter Duration (in minutes)</q-item-label>
    <q-item>
      <q-item-section side>
        <q-icon name="access_time" />
      </q-item-section>
      <q-item-section>
        <q-slider
          style="margin: 0 16px"
          :model-value="
            settingsStore.settings.logs.minimumEncounterDurationInMinutes
          "
          @change="
            (val) => {
              settingsStore.settings.logs.minimumEncounterDurationInMinutes =
                val;
            }
          "
          color="primary"
          label-always
          switch-label-side
          :label-value="`Minimum ${settingsStore.settings.logs.minimumEncounterDurationInMinutes} minute(s)`"
          markers
          marker-labels
          :min="0"
          :max="3"
          :step="0.5"
        >
          <template v-slot:marker-label-group="scope">
            <div
              v-for="marker in scope.markerList"
              :key="marker.index"
              :class="[
                `text-blue-${2 + Math.ceil(marker.value / 2)}`,
                marker.classes,
              ]"
              :style="marker.style"
              @click="model = marker.value"
            >
              {{ marker.value }}
            </div>
          </template>
        </q-slider>
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Actions</q-item-label>
  </q-list>

  <q-btn
    style="margin-left: 16px"
    unelevated
    color="red"
    label="Wipe Parsed Log Cache"
    @click="wipeParsedLogs"
  />
  <q-btn
    style="margin-left: 16px"
    unelevated
    color="primary"
    label="Open Folder"
    @click="openLogDirectory"
  />
</template>

<script setup>
import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

function wipeParsedLogs() {
  window.messageApi.send("window-to-main", {
    message: "wipe-parsed-logs",
  });
}

function openLogDirectory() {
  window.messageApi.send("window-to-main", { message: "open-log-directory" });
}
</script>
