import { headerId, tabId } from "app/shared";
import { ref, toRaw, watch } from "vue";

export const settings = ref(window.ipc.getSettings());

// avoid a loop
let isChanged = false;

watch(
  settings,
  (state) => {
    if (isChanged) isChanged = false;
    else {
      window.ipc.saveSettings(toRaw(state));
      console.log("sending settings");
    }
  },
  { deep: true }
);

window.ipc.onSettingsChanged((newSettings) => {
  isChanged = true;
  settings.value = newSettings;
});

export function tabsIncludes(tab: keyof typeof tabId): boolean {
  return settings.value.damageMeter.tabs.includes(tab);
}

export function headerInclude(tab: keyof typeof headerId): boolean {
  return settings.value.damageMeter.header.includes(tab);
}

export function getClassColor(classId: number) {
  if (classId in settings.value.damageMeter.classes) return settings.value.damageMeter.classes[classId];
  return "#353535";
}
