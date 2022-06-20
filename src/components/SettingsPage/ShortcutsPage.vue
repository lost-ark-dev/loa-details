<template>
  <q-list>
    <q-item-label header>Damage Meter</q-item-label>

    <q-item
      v-for="shortcut in Object.keys(settingsStore.settings.shortcuts)"
      :key="shortcut"
      tag="label"
    >
      <q-item-section>
        <q-item-label>{{ getShortcutDescription(shortcut) }}</q-item-label>
      </q-item-section>

      <q-item-section side top>
        <div style="display: flex; align-items: center">
          <q-select
            filled
            :options="shortcutSuffixOptions"
            :model-value="
              settingsStore.settings.shortcuts[shortcut].value.split('+')[0]
            "
            @update:model-value="updateModelValue(shortcut, true, $event)"
          />
          <span style="margin: 0 8px">+</span>
          <q-select
            filled
            :options="shortcutOptions"
            :model-value="
              settingsStore.settings.shortcuts[shortcut].value.split('+')[1]
            "
            @update:model-value="updateModelValue(shortcut, false, $event)"
          />
          <q-btn
            flat
            label="Reset"
            @click="
              settingsStore.settings.shortcuts[shortcut].value =
                settingsStore.settings.shortcuts[shortcut].defaultValue
            "
          />
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { ref, watch, onMounted, reactive } from "vue";
import {
  shortcutSuffixOptions,
  shortcutOptions,
} from "src/constants/shortcut-options";
import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

const shortcutDescriptions = reactive({
  minimizeDamageMeter: "Minimize Damage Meter window",
  resetSession: "Reset session on damage meter",
  pauseDamageMeter: "Pause the damage meter",
});

function getShortcutDescription(shortcut) {
  return shortcutDescriptions[shortcut] || shortcut;
}

function updateModelValue(sender, isSuffix, value) {
  const oldVal = settingsStore.settings.shortcuts[sender].value;
  const newVal = isSuffix
    ? `${value.value}+${oldVal.split("+")[1]}`
    : `${oldVal.split("+")[0]}+${value.value}`;
  settingsStore.settings.shortcuts[sender].value = newVal;
}
</script>
