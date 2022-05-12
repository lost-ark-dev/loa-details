<template>
  <div>
    <!-- Encounter selection -->
    <q-select
      v-model="selectedEncounter"
      :options="encounterOptions"
      label="Select Encounter"
    />
    <!-- need to refactor and split damage meter to be able to host it here -->
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";

import { useLogViewerStore } from "../stores/log-viewer";
const logViewerStore = useLogViewerStore();

const props = defineProps({
  logData: Object,
});

const encounterOptions = ref([]);
const selectedEncounter = ref("");

watch(selectedEncounter, (newVal, oldVal) => {
  for (let i = 0; i < props.logData.encounters.length; i++) {
    if (props.logData.encounters[i].name === selectedEncounter.value) {
      logViewerStore.currentEncounterIndex = i;
      break;
    }
  }
});

function onNewLogData() {
  console.log("onNewLogData", props.logData);
  encounterOptions.value = props.logData.encounters.map((x) => x.name);
  selectedEncounter.value = encounterOptions.value[0];
}

onMounted(() => {
  onNewLogData();
});
watch(props.logData, (newVal, oldVal) => {
  onNewLogData();
});
</script>
