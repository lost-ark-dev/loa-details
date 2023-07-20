<template>
  <q-scroll-area
    ref="verticalScrollArea"
    style="height: calc(100vh - 32px - 56px)"
  >
    <div class="flex justify-start column">
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
            v-if="logViewerStore.viewerState === 'none'"
            filled
            v-model="logViewerStore.logfileFilter"
            @update:model-value="computedLogFileList()"
            multiple
            :options="logViewerStore.encounterOptions"
            label="Filter encounters"
            style="width: 256px"
          >
            <template
              v-if="logViewerStore.logfileFilter.length > 0"
              v-slot:append
            >
              <q-icon
                name="cancel"
                @click.stop.prevent="
                  logViewerStore.logfileFilter = [];
                  computedLogFileList();
                "
                class="cursor-pointer q-field__focusable-action"
              />
            </template>
          </q-select>

          <q-select
            v-if="logViewerStore.viewerState === 'viewing-session'"
            filled
            v-model="logViewerStore.encounterFilter"
            @update:model-value="calculateEncounterRows()"
            multiple
            :options="logViewerStore.encounterOptions"
            label="Filter encounters"
            style="width: 256px"
          >
            <template
              v-if="logViewerStore.encounterFilter.length > 0"
              v-slot:append
            >
              <q-icon
                name="cancel"
                @click.stop.prevent="
                  logViewerStore.encounterFilter = [];
                  calculateEncounterRows();
                "
                class="cursor-pointer q-field__focusable-action"
              />
            </template>
          </q-select>

          <q-select
            v-if="logViewerStore.viewerState === 'viewing-session'"
            filled
            v-model="logViewerStore.sessionsOrder"
            @update:model-value="reOrderSessions()"
            :options="[
              { label: 'Newest', value: 'desc' },
              { label: 'Oldest', value: 'asc' },
            ]"
            label="Sessions Order"
            style="width: 256px; margin-left: 10px"
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
            @click="($refs.logView as any).takeScreenshot()"
            style="margin-left: auto"
          >
            <q-list>
              <q-item
                clickable
                v-close-popup
                @click="($refs.logView as any).takeScreenshot(false)"
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
            :rows="logViewerStore.computedSessions"
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
              v-for="(encounter, index) in encounterRows"
              :key="`${index}-${encounter}`"
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
                ref="horizontalScrollAreas"
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
          logFile.viewingLogFile &&
          logFile.data
        "
        class="logs-page"
      >
        <LogView ref="logView" :log-data="logFile.data" />
      </div>
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, Ref } from "vue";
import dayjs from "dayjs";
import {
  millisToMinutesAndSeconds,
  millisToHourMinuteSeconds,
} from "src/util/number-helpers";

import LogView from "src/components/LogView.vue";

import { useSettingsStore } from "src/stores/settings";
import {
  type ViewerState,
  type SessionInfo,
  type SessionData,
  useLogViewerStore,
} from "src/stores/log-viewer";
import type {
  GameStateFile,
  ParsedLogInfo,
} from "src-electron/log-parser/file-parser";
import { sleep } from "src/util/sleep";

import { encounters } from "src/constants/encounters";

import relativeTime from "dayjs/plugin/relativeTime";
import { QScrollArea, QTableProps } from "quasar";
dayjs.extend(relativeTime);
type RowData = {
  encounterName: string;
  image: string;
  startingMs: number;
  duration: number;
  attempts: SessionData[];
};

const settingsStore = useSettingsStore();
const logViewerStore = useLogViewerStore();

const loaderImg = new URL("../assets/images/loader.gif", import.meta.url).href;

const verticalScrollOffsets: Record<string, number> = {};
const horizontalScrollOffsets: number[] = [];
const verticalScrollArea: Ref<QScrollArea | undefined> = ref(undefined);
const horizontalScrollAreas: Ref<QScrollArea[]> = ref([]);

async function changeLogViewerStoreState(newState: ViewerState) {
  if (verticalScrollArea.value)
    verticalScrollOffsets[logViewerStore.viewerState] =
      verticalScrollArea.value.getScroll().verticalPosition; //Save previous position

  const oldState = logViewerStore.viewerState;
  if (newState === "viewing-session") {
    if (oldState === "none") {
      verticalScrollOffsets[newState] = 0; //Reset scroll when we open a new session
      horizontalScrollOffsets.length = 0;
    } else if (oldState === "viewing-encounter") {
    }
  } else if (newState === "viewing-encounter") {
    verticalScrollOffsets[newState] = 0; //Reset scroll when we enter encounter view
    //Save horizontal scrolls
    horizontalScrollOffsets.length = 0;
    for (const hscroll of horizontalScrollAreas.value) {
      horizontalScrollOffsets.push(hscroll.getScroll().horizontalPosition);
    }
  }
  logViewerStore.viewerState = newState;
  if (verticalScrollArea.value || horizontalScrollAreas.value) {
    await nextTick();
    //apply vertical scroll
    verticalScrollArea.value?.setScrollPosition(
      "vertical",
      verticalScrollOffsets[newState] ?? 0
    );
    //apply all horizontal scroll
    if (
      horizontalScrollAreas.value &&
      horizontalScrollAreas.value.length === horizontalScrollOffsets.length
    )
      horizontalScrollOffsets.forEach((val, index) => {
        horizontalScrollAreas.value[index]?.setScrollPosition(
          "horizontal",
          val
        );
      });
  }
}

/* Start session table */
const sessionColumns: QTableProps["columns"] = [
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

const sessionPagination: Ref<QTableProps["pagination"]> = ref({
  sortBy: "desc",
  descending: false,
  page: 1,
  rowsPerPage: 5,
});

function onSessionPagination(newPagination: QTableProps["pagination"]) {
  sessionPagination.value = newPagination;
}
function onSessionRowClick(event: Event, row: SessionInfo) {
  void changeLogViewerStoreState("viewing-session");

  logViewerStore.currentSessionName = row.filename;

  logViewerStore.encounterOptions = [];
  logViewerStore.encounterFilter.length = 0;

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

  logViewerStore.encounterOptions.sort();
  calculateEncounterRows();
}

function calculateEncounterRows() {
  const rows: RowData[] = [];

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
          logViewerStore.encounterFilter.length > 0 &&
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

  reOrderSessions();
}
/* End session table */

function reOrderSessions() {
  if (encounterRows.value.length === 1) return;

  const firstEncounter = encounterRows.value.at(0);
  const lastEncounter = encounterRows.value.at(-1);

  if (!firstEncounter || !lastEncounter) return;

  const currentOrientation =
    firstEncounter.startingMs < lastEncounter.startingMs ? "asc" : "desc";

  if (currentOrientation === logViewerStore.sessionsOrder.value) return;

  encounterRows.value.reverse();
}

/* Start encounter table */
const encounterRows: Ref<RowData[]> = ref([]);

function onEncounterRowClick(row: SessionData) {
  void changeLogViewerStoreState("viewing-encounter");

  logViewerStore.currentEncounterName = row.filename;

  window.messageApi.send("window-to-main", {
    message: "get-parsed-log",
    value: row.filename,
  });
}
/* End session table */

const logFile: { viewingLogFile: boolean; data?: GameStateFile } = reactive({
  viewingLogFile: false,
});

function calculateLogFileList(value: ParsedLogInfo[]) {
  logViewerStore.resetState();

  logViewerStore.encounterOptions = [];

  value.forEach((val) => {
    let totalDuration = 0;
    let sessionEncounters: SessionData[] = [];

    val.parsedContents.encounters.forEach((val_encounter) => {
      totalDuration += val_encounter.duration;

      sessionEncounters.push({
        filename: val_encounter.encounterFile,
        encounterName: val_encounter.mostDamageTakenEntity.name,
        durationTs: val_encounter.duration,
        duration: millisToMinutesAndSeconds(val_encounter.duration),
      });
    });

    sessionEncounters.forEach((encounter) => {
      let encounterName = encounter.encounterName;

      if (!logViewerStore.encounterOptions.includes(encounterName)) {
        logViewerStore.encounterOptions.push(encounterName);
      }
    });

    logViewerStore.encounterOptions.sort();

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
  logViewerStore.computedSessions = JSON.parse(
    JSON.stringify(logViewerStore.sessions)
  ) as SessionInfo[];

  logViewerStore.viewerState =
    logViewerStore.sessions.length > 0 ? "none" : "no-data";
}

function computedLogFileList() {
  if (logViewerStore.logfileFilter.length === 0) {
    logViewerStore.computedSessions = logViewerStore.sessions;
    return;
  }

  const filteredSessions: SessionInfo[] = [];

  logViewerStore.sessions.forEach((session) => {
    const filteredEncounters = [];

    session.sessionEncounters.forEach((encounter) => {
      if (logViewerStore.logfileFilter.includes(encounter.encounterName)) {
        filteredEncounters.push(encounter);
      }
    });

    if (filteredEncounters.length > 0) {
      filteredSessions.push(session);
    }
  });

  logViewerStore.computedSessions = filteredSessions;
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

  window.messageApi.receive("parsed-log", (value: GameStateFile) => {
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
