<template>
  <q-page class="flex justify-start column">
    <div
      v-if="logFiles.length === 0 && !noLogsFound"
      class="flex column items-center justify-center spinner"
    >
      <img class="loader-img" :src="loaderImg" />
      <span>Parsing logs...</span>
      <div v-if="isReceivingParserStatus" style="text-align: center">
        <q-linear-progress
          :value="parserStatus.completedJobs / parserStatus.totalJobs"
          class="q-mt-md"
          style="width: 128px"
        />
        <div style="margin-top: 8px">
          {{ parserStatus.completedJobs }} / {{ parserStatus.totalJobs }}
        </div>
      </div>
    </div>
    <q-scroll-area
      v-if="!logFile.viewingLogFile && !isReceivingParserStatus"
      style="height: calc(100vh - 80px); padding: 8px 16px"
    >
      <div class="flex logs-top-bar">
        <q-select
          filled
          v-model="encounterFilter"
          multiple
          clearable
          :options="encounterOptions"
          label="Filter encounters"
          style="width: 250px"
        />

        <div>
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
        <q-btn
          icon="screenshot_monitor"
          unelevated
          color="primary"
          label="Share Log (Screenshot)"
          @click="$refs.logView.takeScreenshot()"
          style="margin-left: auto"
        />
      </div>
      <LogView ref="logView" :log-data="logFile.data" />
    </q-scroll-area>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import { millisToMinutesAndSeconds } from "src/util/number-helpers";

import LogView from "src/components/LogView.vue";

import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

const loaderImg = new URL(`../assets/images/loader.gif`, import.meta.url).href;

const logsPagination = ref({
  sortBy: "desc",
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

const encounterFilter = ref(null);
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
const noLogsFound = ref(false);
const logFilesComputed = computed(() => {
  return logFiles.value
    .filter((x) =>
      encounterFilter.value && encounterFilter.value.length > 0
        ? encounterFilter.value.includes(x.encounterName)
        : true
    )
    .filter((x) => {
      return (
        x.durationTs / (1000 * 60) >=
        settingsStore.settings.logs.minimumDurationInMinutes
      );
    });
});
const logFile = reactive({
  viewingLogFile: false,
  data: {},
});

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

const isReceivingParserStatus = ref(false);
const parserStatus = ref({
  completedJobs: 0,
  totalJobs: 0,
});

onMounted(() => {
  getLogfiles();

  window.messageApi.receive("parsed-logs-list", (value) => {
    if (value.length === 0) noLogsFound.value = true;

    isReceivingParserStatus.value = false;
    parserStatus.value = {
      completedJobs: 0,
      totalJobs: 0,
    };

    calculateLogFileList(value);
  });

  window.messageApi.receive("parsed-log", (value) => {
    logFile.data = value;
    logFile.viewingLogFile = true;
  });

  window.messageApi.receive("log-parser-status", (value) => {
    if (value.completedJobs && value.totalJobs) {
      isReceivingParserStatus.value = true;
      parserStatus.value = value;
    }
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
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}
</style>
