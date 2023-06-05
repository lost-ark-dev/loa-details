<template>
  <q-list>
    <q-item-label header>Damage Meter</q-item-label>

    <q-item
      v-for="shortcut in (Object.keys(settings.shortcuts) as Array<keyof typeof shortcutsId>)"
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
            :model-value="settings.shortcuts[shortcut].split('+')[0]"
            @update:model-value="updateModelValue(shortcut, true, $event)"
          />
          <span style="margin: 0 8px">+</span>
          <q-select
            filled
            :options="shortcutOptions"
            :model-value="settings.shortcuts[shortcut].split('+')[1]"
            @update:model-value="updateModelValue(shortcut, false, $event)"
          />
          <q-btn flat label="Reset" @click="settings.shortcuts[shortcut] = shortcutsId[shortcut]" />
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { shortcutsId } from "app/shared";
import { shortcutOptions, shortcutSuffixOptions } from "src/constants/shortcut-options";
import { settings } from "src/stores/settings";
import { reactive } from "vue";

const shortcutDescriptions = reactive({
  minimizeDamageMeter: "Minimize Damage Meter window",
  resetSession: "Reset session on damage meter",
  pauseDamageMeter: "Pause the damage meter",
});

function getShortcutDescription(shortcut: keyof typeof settings.value.shortcuts) {
  return shortcutDescriptions[shortcut] || shortcut;
}

function updateModelValue(sender: keyof typeof settings.value.shortcuts, isSuffix: boolean, value: string) {
  const oldVal = settings.value.shortcuts[sender];
  const newVal = isSuffix ? `${value}+${oldVal.split("+")[1]}` : `${oldVal.split("+")[0]}+${value}`;
  settings.value.shortcuts[sender] = newVal;
}
</script>
