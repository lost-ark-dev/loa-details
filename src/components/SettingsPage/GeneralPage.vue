<template>
  <q-list>
    <q-item-label header>General</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.general.startMainMinimized"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Hide Main App on Startup</q-item-label>
        <q-item-label caption>
          Start the main app (this window) minimized.
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { useSettingsStore } from "../../stores/settings";
const settingsStore = useSettingsStore();
</script>
