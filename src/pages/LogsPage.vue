<template>
  <q-page class="flex justify-start column">
    <div
      v-if="logFiles.length === 0"
      class="flex column items-center justify-center spinner"
    >
      <img class="loader-img" :src="loaderImg" />
      <span>Fetching logs...</span>
    </div>
    <q-scroll-area
      v-if="logFiles.length > 0 && !logFile.viewingLogFile"
      style="height: calc(100vh - 80px); padding: 8px 16px"
    >
      <div class="flex logs-top-bar">
        <div style="margin-left: auto">
          <q-btn
            unelevated
            color="primary"
            label="Open Folder"
            @click="openLogDirectory"
          />
          <q-btn
            style="margin-left: 16px"
            unelevated
            color="primary"
            label="Refresh"
            @click="getLogfiles"
          />
        </div>
        <div style="display: flex; width: 100%; margin: 16px 0">
          <q-select
            filled
            v-model="encounterFilter"
            multiple
            clearable
            :options="encounterOptions"
            label="Filter encounters"
            style="width: 250px"
          />

          <q-slider
            style="margin: 0 16px"
            :model-value="durationSlider"
            @change="
              (val) => {
                durationSlider = val;
              }
            "
            color="primary"
            label-always
            switch-label-side
            :label-value="'Minimum ' + durationSlider + ' minutes'"
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
        </div>
      </div>

      <q-table
        title="Logs"
        :rows="logFilesComputed"
        :columns="columns"
        :visible-columns="visibleColumns"
        row-key="filename"
        dark
        color="amber"
        @row-click="onRowClick"
        :pagination="logsPagination"
        @update:pagination="onPagination"
      >
        <template v-slot:body-cell="props">
          <q-td :props="props" :style="props.row.rowStyle">
            {{ props.value }}
          </q-td>
        </template>
      </q-table>
    </q-scroll-area>
    <q-scroll-area
      v-if="logFile.viewingLogFile"
      style="height: calc(100vh - 80px); padding: 8px 16px"
    >
      <div class="flex logs-top-bar">
        <q-btn
          icon="arrow_back"
          unelevated
          color="primary"
          label="BACK"
          @click="logFile.viewingLogFile = false"
        />
      </div>
      <LogView :log-data="logFile.data" />
    </q-scroll-area>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted } from "vue";
import dayjs from "dayjs";

import LogView from "src/components/LogView.vue";

const loaderImg = new URL(`../assets/images/loader.gif`, import.meta.url).href;

const logsPagination = ref({
  sortBy: "desc",
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

const encounterFilter = ref(null);
const durationSlider = ref(0);
const encounterOptions = ref([]);

const columns = [
  {
    name: "rowStyle",
    field: "rowStyle",
    align: "left",
    label: "",
  },
  {
    name: "encounterName",
    field: "encounterName",
    align: "left",
    label: "Encounter",
    sortable: true,
  },
  {
    name: "duration",
    field: "duration",
    align: "left",
    label: "Duration",
    sortable: true,
  },
  {
    name: "dateText",
    field: "dateText",
    align: "left",
    label: "Session Date",
    sortable: true,
    align: "right",
  },
];
const visibleColumns = ref(["encounterName", "duration", "dateText"]);

const logFiles = ref([]);
const logFilesComputed = computed(() => {
  return logFiles.value
    .filter((x) =>
      encounterFilter.value && encounterFilter.value.length > 0
        ? encounterFilter.value.includes(x.encounterName)
        : true
    )
    .filter((x) => {
      return x.durationTs / (1000 * 60) >= durationSlider.value;
    });
});
const logFile = reactive({
  viewingLogFile: false,
  data: {},
});

function millisToMinutesAndSeconds(millis) {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function calculateLogFileList(value) {
  let i = 0;
  value.forEach((val) => {
    i++;

    val.parsedContents.encounters.forEach((val_encounter) => {
      if (
        !encounterOptions.value.includes(
          val_encounter.mostDamageTakenEntity.name
        )
      )
        encounterOptions.value.push(val_encounter.mostDamageTakenEntity.name);

      logFiles.value.push({
        rowStyle: i % 2 === 0 ? "background:#e3cc2640" : "",
        filename: val_encounter.encounterFile,
        encounterName: val_encounter.mostDamageTakenEntity.name,
        date: val.date,
        dateText: dayjs(val.date).format("DD/MM/YYYY HH:mm:ss"),
        durationTs: val_encounter.duration,
        duration: millisToMinutesAndSeconds(val_encounter.duration),
      });
    });
  });

  logFiles.value = logFiles.value.reverse();
}

function onRowClick(event, row) {
  window.messageApi.send("window-to-main", {
    message: "get-parsed-log",
    value: row.filename,
  });
}

function onPagination(newPagination) {
  logsPagination.value = newPagination;
}

function getLogfiles() {
  logFiles.value = [];
  window.messageApi.send("window-to-main", { message: "get-parsed-logs" });
  // Async: window.messageApi.send("window-to-main", { message: "get-parsed-logs", async: true });
}

function openLogDirectory() {
  window.messageApi.send("window-to-main", { message: "open-log-directory" });
}

onMounted(() => {
  getLogfiles();

  window.messageApi.receive("parsed-logs-list", (value) => {
    calculateLogFileList(value);
  });

  window.messageApi.receive("parsed-log", (value) => {
    logFile.data = value;
    logFile.viewingLogFile = true;
  });
});
</script>

<style>
.spinner {
  width: 100%;
  height: calc(100vh - 128px);
}
.loader-img {
  width: 128px;
}
.logs-top-bar {
  padding: 16px 0;
}
</style>
