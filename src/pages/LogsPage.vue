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
              ? logViewerStore.loadingMessage
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
            use-input
            v-model="logViewerStore.logfileFilter"
            @update:model-value="computedLogFileList()"
            multiple
            clearable
            :options="logViewerStore.encounterOptionsFiltered"
            label="Filter encounters"
            @filter="filterEncounterOptions"
            style="width: 256px"
          />

          <q-select
            v-if="logViewerStore.viewerState === 'viewing-session'"
            filled
            use-input
            v-model="logViewerStore.encounterFilter"
            @update:model-value="calculateEncounterRows()"
            multiple
            clearable
            :options="logViewerStore.encounterOptionsFiltered"
            @filter="filterEncounterOptions"
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
              v-for="encounter in encounterRows"
              :key="encounter.startingMs"
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
  SessionPlayerInfo,
} from "src/stores/log-viewer";
import type {
  GameStateFile,
  ParsedLogInfo,
} from "src-electron/log-parser/file-parser";
import { sleep } from "src/util/sleep";

import { encounters } from "src/constants/encounters";

import relativeTime from "dayjs/plugin/relativeTime";
import { QScrollArea, QTableProps } from "quasar";
import { getClassName } from "src/util/helpers";
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
  // set encounter options if we are going to session view
  if (newState === "none") {
    logViewerStore.encounterOptions =
      logViewerStore.encounterOptionsSessionView;
  }
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
function onSessionRowClick(_event: Event, row: SessionInfo) {
  void changeLogViewerStoreState("viewing-session");

  logViewerStore.currentSessionName = row.filename;

  const encounterOptions: Set<string> = new Set();
  row.sessionEncounters.forEach((encounter) => {
    for (const keyword of encounter.searchWords.keys()) {
      encounterOptions.add(keyword);
    }
  });
  logViewerStore.encounterOptions = Array.from(encounterOptions);
  logViewerStore.encounterFilter = [...logViewerStore.logfileFilter];

  // TODO: this should use a HashSet probably
  /*
  // we do not need this anymore
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

    for (const playerInfo of encounter.playerInfos) {
      if (!logViewerStore.encounterOptions.includes(playerInfo.name)) {
        logViewerStore.encounterOptions.push(playerInfo.name);
      }
    }
  });
  */

  logViewerStore.encounterOptions.sort();
  calculateEncounterRows();
}

function calculateEncounterRows() {
  const rows: RowData[] = [];
  // this happens when someone presses the clear button
  // we can not use clear event because it happens after model-value update
  if (logViewerStore.encounterFilter === null) {
    logViewerStore.encounterFilter = [];
  }

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

        let hasAllKeywords = true;
        if (logViewerStore.encounterFilter.length > 0) {
          for (const keyword of logViewerStore.encounterFilter) {
            if (!encounter.searchWords.has(keyword)) {
              hasAllKeywords = false;
              break;
            }
          }
        }

        if (!hasAllKeywords) {
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
            image: encounter.image,
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

const logFileSearchMap: Map<string, Set<SessionInfo>> = new Map();
function calculateLogFileList(value: ParsedLogInfo[]) {
  logViewerStore.resetState();

  logViewerStore.encounterOptions = [];

  value.forEach((val) => {
    let totalDuration = 0;
    const sessionEncounters: SessionData[] = [];

    val.parsedContents.encounters.forEach((val_encounter) => {
      const encounterSearchWords: Set<string> = new Set();
      // normalize entity names to a better recognizable name
      let encounterName = val_encounter.mostDamageTakenEntity.name;
      let image = "";
      for (const encounter of Object.values(encounters)) {
        if (encounter.encounterNames.includes(encounterName)) {
          encounterName = encounter.name;
          image = encounter.image;
          break;
        }
      }
      // add normalized name to the keywords
      // only add encounter if it is not a parsable hex string
      // sometimes encounter names are entityIds, we try to filter these out here
      if (isNaN(parseInt(encounterName, 16)))
        encounterSearchWords.add(encounterName);
      totalDuration += val_encounter.duration;
      const sessionPlayerInfo: SessionPlayerInfo[] = [];
      if (val_encounter.playerInfos) {
        val_encounter.playerInfos.forEach((p) => {
          sessionPlayerInfo.push({
            classid: p.classid,
            gearscore: p.gearscore,
            name: p.name,
          });
          if (p.name.length > 0) encounterSearchWords.add(p.name);
          const className = getClassName(p.classid);
          if (className.length > 0) encounterSearchWords.add(className);
        });
      }
      sessionEncounters.push({
        filename: val_encounter.encounterFile,
        encounterName: encounterName,
        durationTs: val_encounter.duration,
        duration: millisToMinutesAndSeconds(val_encounter.duration),
        playerInfos: sessionPlayerInfo,
        searchWords: encounterSearchWords,
        image,
      });
    });

    if (
      totalDuration >=
      settingsStore.settings.logs.minimumSessionDurationInMinutes * 60 * 1000
    ) {
      const sessionInfo: SessionInfo = {
        filename: val.filename,
        date: val.date,
        dateText: dayjs(val.date).format("DD/MM/YYYY HH:mm:ss"),
        relativeTime: dayjs(val.date).fromNow(),
        totalDurationTs: totalDuration,
        totalDuration: millisToHourMinuteSeconds(totalDuration),
        sessionEncounters,
      };
      logViewerStore.sessions.push(sessionInfo);

      // add to search map
      sessionInfo.sessionEncounters.forEach((sessionData) => {
        sessionData.searchWords.forEach((v) => {
          const sessionSet = logFileSearchMap.get(v) ?? new Set<SessionInfo>();
          sessionSet.add(sessionInfo);
          if (!logFileSearchMap.has(v)) {
            logFileSearchMap.set(v, sessionSet);
          }
        });
      });
    }
  });

  /**
   * Use our search map to create a list of possible filter options
   */
  logViewerStore.encounterOptionsSessionView = Array.from(
    logFileSearchMap.keys()
  );
  logViewerStore.encounterOptionsSessionView.sort();
  logViewerStore.encounterOptions = logViewerStore.encounterOptionsSessionView;

  logViewerStore.sessions.reverse();
  logViewerStore.computedSessions = logViewerStore.sessions;

  logViewerStore.viewerState =
    logViewerStore.sessions.length > 0 ? "none" : "no-data";
}

function computedLogFileList() {
  // this happens when someone presses the clear button
  // we can not use clear event because it happens after model-value update
  if (logViewerStore.logfileFilter === null) {
    logViewerStore.logfileFilter = [];
  }
  if (logViewerStore.logfileFilter.length === 0) {
    logViewerStore.computedSessions = logViewerStore.sessions;
    return;
  }

  const logFilesForKeywords: Set<SessionInfo>[] = [];
  logViewerStore.logfileFilter.forEach((filterWord) => {
    const sessionForWord: Set<SessionInfo> | undefined =
      logFileSearchMap.get(filterWord);
    if (sessionForWord !== undefined) {
      logFilesForKeywords.push(sessionForWord);
    }
  });
  // we want to make filter AND so get intersection between all the sets
  let finalSessionSet: Set<SessionInfo> = new Set();
  if (logFilesForKeywords.length > 0) {
    finalSessionSet = new Set(logFilesForKeywords[0]);
    // if we have more then 1 we need to intersect
    if (logFilesForKeywords.length > 1) {
      for (let idx = 1; idx < logFilesForKeywords.length; idx++) {
        const compSet = logFilesForKeywords[idx];
        for (const a of finalSessionSet) {
          if (!compSet.has(a)) {
            finalSessionSet.delete(a);
          }
        }
      }
    }
  }

  // now we have all our sessions in finalSessionSet that contain all of the keywords
  // but we want all of the keywords in a single encounter so filter further from here
  finalSessionSet.forEach((session) => {
    // one encounter that has all keywords is enough to keep the session
    let atLeastOneEncounterHasAllKeywords = false;
    if (logViewerStore.logfileFilter.length === 0) {
      atLeastOneEncounterHasAllKeywords = true;
    } else {
      for (const encounter of session.sessionEncounters) {
        let encounterHasAllKeywords = true;
        for (const keyword of logViewerStore.logfileFilter) {
          if (!encounter.searchWords.has(keyword)) {
            encounterHasAllKeywords = false;
            break;
          }
        }
        if (encounterHasAllKeywords) {
          atLeastOneEncounterHasAllKeywords = true;
          // we just need to find one, so exist loop early
          break;
        }
      }
    }
    if (!atLeastOneEncounterHasAllKeywords) {
      finalSessionSet.delete(session);
    }
  });

  logViewerStore.computedSessions = Array.from(finalSessionSet);
}

function filterEncounterOptions(
  inputValue: string,
  // first function gets called to do filter update
  // 2nd function gets called after filter update was done
  setCallbacks: (
    updateFilterCallback: { (): void },
    afterUpdateCallback?: { (): void }
  ) => void
) {
  if (inputValue === "") {
    setCallbacks(() => {
      logViewerStore.encounterOptionsFiltered = logViewerStore.encounterOptions;
    });
    return;
  }

  setCallbacks(() => {
    const needle = inputValue.toLowerCase();
    logViewerStore.encounterOptionsFiltered =
      logViewerStore.encounterOptions.filter(
        (v: string) => v.toLowerCase().indexOf(needle) > -1
      );
  });
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
      logViewerStore.loadingMessage = value.msg;
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
