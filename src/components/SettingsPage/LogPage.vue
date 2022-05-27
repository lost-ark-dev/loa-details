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

    <q-item>
      <q-item-section side>
        <q-icon name="access_time" />
      </q-item-section>
      <q-item-section>
        <q-slider
          style="margin: 0 16px"
          :model-value="settingsStore.settings.logs.minimumDurationInMinutes"
          @change="
            (val) => {
              settingsStore.settings.logs.minimumDurationInMinutes = val;
            }
          "
          color="primary"
          label-always
          switch-label-side
          :label-value="`Minimum ${settingsStore.settings.logs.minimumDurationInMinutes} minute(s)`"
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

    <q-item tag="label">
      <q-item-section>
        <q-item-label>
          Pressing this button will wipe parsed logs and LOA Details will
          re-parse every log once you open the Logs page.
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-btn color="red" @click="wipeParsedLogs">Wipe Parsed Log Cache</q-btn>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { useSettingsStore } from "../../stores/settings";
const settingsStore = useSettingsStore();

function wipeParsedLogs() {
  window.messageApi.send("window-to-main", {
    message: "wipe-parsed-logs",
  });
}
</script>
