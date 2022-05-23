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
        <q-select
          filled
          v-model="encounterFilter"
          multiple
          clearable
          :options="encounterOptions"
          label="Filter encounters"
          style="width: 250px"
        />

        <q-btn
          style="margin-left: auto"
          unelevated
          color="primary"
          label="Refresh"
          @click="getLogfiles"
        />
      </div>

      <q-table
        title="Logs"
        :rows="logFilesComputed"
        :columns="columns"
        row-key="filename"
        dark
        color="amber"
        @row-click="onRowClick"
        :pagination="logsPagination"
        @update:pagination="onPagination"
      />
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
import { ref, computed, reactive, onMounted } from "vue";
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
const encounterOptions = ref([]);

const columns = [
  {
    name: "encounterName",
    field: "encounterName",
    align: "left",
    label: "Encounter",
    sortable: true,
  },
  {
    name: "dateText",
    field: "dateText",
    align: "left",
    label: "Date",
    sortable: true,
    align: "right",
  },
];

const logFiles = ref([]);
const logFilesComputed = computed(() => {
  return logFiles.value.filter((x) =>
    encounterFilter.value
      ? encounterFilter.value.includes(x.encounterName)
      : true
  );
});
const logFile = reactive({
  viewingLogFile: false,
  data: {},
});

function calculateLogFileList(value) {
  value
    .filter((x) => x.size > 8192)
    .forEach((val) => {
      if (!encounterOptions.value.includes(val.encounterName))
        encounterOptions.value.push(val.encounterName);

      logFiles.value.push({
        filename: val.filename,
        encounterName: val.encounterName,
        date: val.date,
        dateText: dayjs(val.date).format("DD/MM/YYYY HH:mm:ss"),
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
