import { defineStore } from "pinia";

export type SessionData = {
  filename: string;
  encounterName: string;
  durationTs: number;
  duration: string;
  playerInfos: SessionPlayerInfo[];
  searchWords: Set<string>;
  image: string;
};

export type SessionPlayerInfo = {
  name: string;
  classid: number;
  gearscore: number;
};

export type SessionInfo = {
  filename: string;
  date: Date;
  dateText: string;
  relativeTime: string;
  totalDurationTs: number;
  totalDuration: string;
  sessionEncounters: SessionData[];
};

export type ViewerState =
  | "loading"
  | "no-data"
  | "none"
  | "viewing-session"
  | "viewing-encounter"
  | "viewing-log";
type State = {
  viewerState: ViewerState;
  loadingMessage: string;
  currentSessionName: string;
  currentEncounterName: string;
  sessions: SessionInfo[];
  computedSessions: SessionInfo[];
  encounterOptions: string[];
  encounterOptionsSessionView: string[];
  encounterOptionsFiltered: string[];
  encounterFilter: string[];
  logfileFilter: string[];
};

export const useLogViewerStore = defineStore("log-viewer", {
  state: (): State => ({
    viewerState: "loading",
    loadingMessage: "Parsing logs",
    currentSessionName: "",
    currentEncounterName: "",
    sessions: [],
    computedSessions: [],
    encounterOptions: [],
    encounterOptionsSessionView: [],
    encounterOptionsFiltered: [],
    encounterFilter: [],
    logfileFilter: [],
  }),
  actions: {
    resetState() {
      this.viewerState = "loading";
      this.loadingMessage = "Parsing logs";
      this.currentSessionName = "";
      this.currentEncounterName = "";
      this.sessions = [];
      this.computedSessions = [];
      this.encounterOptions = [];
      this.encounterOptionsSessionView = [];
      this.encounterOptionsFiltered = [];
      this.encounterFilter = [];
      this.logfileFilter = [];
    },
  },
});
