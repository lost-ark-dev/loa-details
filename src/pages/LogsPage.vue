<template>
  <q-scroll-area
    ref="scrollArea"
    style="height: calc(100vh - 4px - 32px - 66px)"
  >
    <q-page class="flex justify-start column">
      <div
        v-if="
          logViewerStore.viewerState === 'loading' ||
          logViewerStore.viewerState === 'no-data'
        "
        class="flex column items-center justify-center spinner"
      >
        <img
          v-if="logViewerStore.viewerState === 'loading'"
          class="loader-img"
          :src="loaderImg"
        />

        <span>
          {{
            logViewerStore.viewerState === "loading"
              ? "Parsing logs"
              : "No data found"
          }}
        </span>

        <q-btn
          v-if="logViewerStore.viewerState === 'no-data'"
          style="margin-top: 8px"
          unelevated
          color="primary"
          label="Refresh"
          @click="getLogfiles"
        />

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

      <div v-else class="logs-page">
        <div class="flex logs-top-bar">
          <q-btn
            v-if="logViewerStore.viewerState === 'viewing-encounter'"
            icon="arrow_back"
            unelevated
            color="primary"
            label="BACK"
            @click="changeLogViewerStoreState('viewing-session')"
          />

          <q-select
            v-else-if="logViewerStore.viewerState === 'viewing-session'"
            filled
            v-model="logViewerStore.encounterFilter"
            @update:model-value="calculateEncounterRows()"
            multiple
            clearable
            :options="logViewerStore.encounterOptions"
            label="Filter encounters"
            style="width: 256px"
          />

          <q-space />

          <div v-if="logViewerStore.viewerState === 'none'">
            <q-btn
              unelevated
              color="primary"
              label="Open Folder"
              @click="openLogDirectory"
            />
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
              label="Refresh"
              @click="getLogfiles"
            />
          </div>

          <q-btn-dropdown
            v-else-if="logViewerStore.viewerState === 'viewing-encounter'"
            split
            unelevated
            icon="screenshot_monitor"
            color="primary"
            label="Screenshot Log"
            @click="$refs.logView.takeScreenshot()"
            style="margin-left: auto"
          >
            <q-list>
              <q-item
                clickable
                v-close-popup
                @click="$refs.logView.takeScreenshot((hideNames = false))"
              >
                <q-item-section>
                  <q-item-label>Screenshot With Names</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <div v-if="logViewerStore.viewerState === 'none'">
          <q-table
            title="Sessions"
            :rows="logViewerStore.sessions"
            :columns="sessionColumns"
            row-key="dateText"
            dark
            @row-click="onSessionRowClick"
            :pagination="sessionPagination"
            @update:pagination="onSessionPagination"
          />
        </div>

        <div v-else-if="logViewerStore.viewerState === 'viewing-session'">
          <q-page-sticky
            position="bottom-left"
            :offset="[32, 32]"
            style="z-index: 1000000"
          >
            <q-btn
              fab
              icon="arrow_back"
              color="primary"
              @click="changeLogViewerStoreState('none')"
            />
          </q-page-sticky>
          <q-timeline dark color="secondary">
            <q-timeline-entry
              v-if="encounterRows.length === 0"
              style="font-size: 24px; font-family: 'questrial'"
            >
              No encounter found based on filter and options.
            </q-timeline-entry>

            <q-timeline-entry
              v-for="encounter in encounterRows"
              :key="encounter.encounterName"
              :title="
                encounter.encounterName +
                ' | ' +
                encounter.attempts.length +
                ' attempt(s)'
              "
              :subtitle="
                millisToHourMinuteSeconds(encounter.startingMs) +
                ' - ' +
                millisToHourMinuteSeconds(
                  encounter.startingMs + encounter.duration
                )
              "
            >
              <q-scroll-area
                style="width: calc(100vw - 96px - 12px)"
                :style="{ height: encounter.image ? '272px' : '96px' }"
              >
                <div class="row no-wrap">
                  <q-card
                    v-for="(attempt, index) in encounter.attempts"
                    :key="attempt.filename"
                    dark
                    class="my-card q-mr-md"
                    style="width: 256px"
                    @click="onEncounterRowClick(attempt)"
                  >
                    <img v-if="encounter.image" :src="encounter.image" />

                    <q-card-section>
                      <div class="text-h6">Attempt {{ index + 1 }}</div>
                      <div class="text-subtitle2">{{ attempt.duration }}</div>
                    </q-card-section>
                  </q-card>
                </div>
              </q-scroll-area>
            </q-timeline-entry>
          </q-timeline>
        </div>
      </div>

      <div
        v-if="
          logViewerStore.viewerState === 'viewing-encounter' &&
          logFile.viewingLogFile
        "
        class="logs-page"
      >
        <LogView ref="logView" :log-data="logFile.data" />
      </div>
    </q-page>
  </q-scroll-area>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import dayjs from "dayjs";
import {
  millisToMinutesAndSeconds,
  millisToHourMinuteSeconds,
} from "src/util/number-helpers";

import LogView from "src/components/LogView.vue";

import { useSettingsStore } from "src/stores/settings";
import { useLogViewerStore } from "src/stores/log-viewer";
import { sleep } from "src/util/sleep";

import { encounters } from "src/constants/encounters";

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const settingsStore = useSettingsStore();
const logViewerStore = useLogViewerStore();

const loaderImg = new URL(`../assets/images/loader.gif`, import.meta.url).href;

const scrollArea = ref(null);
function changeLogViewerStoreState(newState) {
  logViewerStore.viewerState = newState;
  if (scrollArea.value) scrollArea.value.setScrollPosition("vertical", 0);
}

/* Start session table */
const sessionColumns = [
  {
    name: "dateText",
    field: "dateText",
    align: "left",
    label: "Session Date",
    sortable: true,
  },
  {
    name: "relativeTime",
    field: "relativeTime",
    align: "left",
    label: "Relative Time",
    sortable: false,
  },
  {
    name: "totalDuration",
    field: "totalDuration",
    align: "right",
    label: "Duration (H:M:S)",
    sortable: true,
  },
];

const sessionPagination = ref({
  sortBy: "desc",
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

function onSessionPagination(newPagination) {
  sessionPagination.value = newPagination;
}

function onSessionRowClick(event, row) {
  changeLogViewerStoreState("viewing-session");

  logViewerStore.currentSessionName = row.filename;

  logViewerStore.encounterOptions = [];
  logViewerStore.encounterFilter = null;

  row.sessionEncounters.forEach((encounter) => {
    let encounterName = encounter.encounterName;
    Object.values(encounters).forEach((encounter) => {
      if (encounter.encounterNames.includes(encounterName)) {
        encounterName = encounter.name;
        return;
      }
    });

    // Add encounter name to the encounter options list
    if (!logViewerStore.encounterOptions.includes(encounterName)) {
      logViewerStore.encounterOptions.push(encounterName);
    }
  });

  calculateEncounterRows();
}

function calculateEncounterRows() {
  const rows = [];

  logViewerStore.sessions.forEach((session) => {
    if (session.filename === logViewerStore.currentSessionName) {
      let startingMs = 0;

      session.sessionEncounters.forEach((encounter) => {
        startingMs += encounter.durationTs;

        if (
          encounter.durationTs <=
          settingsStore.settings.logs.minimumEncounterDurationInMinutes *
            60 *
            1000
        ) {
          return;
        }

        let encounterName = encounter.encounterName;
        let image = "";

        Object.values(encounters).forEach((encounter) => {
          if (encounter.encounterNames.includes(encounterName)) {
            encounterName = encounter.name;
            image = encounter.image;
            return;
          }
        });

        if (
          logViewerStore.encounterFilter &&
          Object.keys(logViewerStore.encounterFilter).length > 0 &&
          !logViewerStore.encounterFilter.includes(encounterName) // not includes
        ) {
          return;
        }

        if (
          rows.length > 0 &&
          rows[rows.length - 1].encounterName === encounterName
        ) {
          rows[rows.length - 1].duration += encounter.durationTs;
          rows[rows.length - 1].attempts.push(encounter);
        } else {
          rows.push({
            encounterName,
            image,
            startingMs,
            duration: encounter.durationTs,
            attempts: [encounter],
          });
        }

        /* if (
          !logViewerStore.encounterFilter ||
          (logViewerStore.encounterFilter &&
            Object.keys(logViewerStore.encounterFilter).length === 0) ||
          (logViewerStore.encounterFilter &&
            Object.keys(logViewerStore.encounterFilter).length > 0 &&
            logViewerStore.encounterFilter.includes(encounter.encounterName))
        ) {
          rows.push(encounter);
        } */
      });

      encounterRows.value = rows;
      return;
    }
  });
}
/* End session table */

/* Start encounter table */
const encounterRows = ref([]);

function onEncounterRowClick(row) {
  changeLogViewerStoreState("viewing-encounter");

  logViewerStore.currentEncounterName = row.filename;

  window.messageApi.send("window-to-main", {
    message: "get-parsed-log",
    value: row.filename,
  });
}
/* End session table */

const logFile = reactive({
  viewingLogFile: false,
  data: {},
});

function calculateLogFileList(value) {
  logViewerStore.resetState();

  value.forEach((val) => {
    let totalDuration = 0;
    let sessionEncounters = [];

    val.parsedContents.encounters.forEach((val_encounter) => {
      totalDuration += val_encounter.duration;

      sessionEncounters.push({
        filename: val_encounter.encounterFile,
        encounterName: val_encounter.mostDamageTakenEntity.name,
        durationTs: val_encounter.duration,
        duration: millisToMinutesAndSeconds(val_encounter.duration),
      });
    });

    if (
      totalDuration >=
      settingsStore.settings.logs.minimumSessionDurationInMinutes * 60 * 1000
    ) {
      logViewerStore.sessions.push({
        filename: val.filename,
        date: val.date,
        dateText: dayjs(val.date).format("DD/MM/YYYY HH:mm:ss"),
        relativeTime: dayjs(val.date).fromNow(),
        totalDurationTs: totalDuration,
        totalDuration: millisToHourMinuteSeconds(totalDuration),
        sessionEncounters,
      });
    }
  });

  logViewerStore.sessions.reverse();

  logViewerStore.viewerState =
    logViewerStore.sessions.length > 0 ? "none" : "no-data";
}

function getLogfiles() {
  logViewerStore.resetState();

  window.messageApi.send("window-to-main", {
    message: "parse-logs",
    async: true,
  });
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

      if (value.completedJobs === value.totalJobs) {
        window.messageApi.send("window-to-main", {
          message: "get-parsed-logs",
          async: true,
        });
      }
    }
  });
});

async function wipeParsedLogs() {
  window.messageApi.send("window-to-main", {
    message: "wipe-parsed-logs",
  });

  await sleep(1000);
  getLogfiles();
}
</script>

<style>
.logs-page {
  padding: 16px 32px;
}
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
