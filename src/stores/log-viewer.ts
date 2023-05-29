import { defineStore } from "pinia";

export type SessionData = {
  filename: string;
  encounterName: string;
  durationTs: number;
  duration: string;
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
  currentSessionName: string;
  currentEncounterName: string;
  sessions: SessionInfo[];
  computedSessions: SessionInfo[];
  encounterOptions: string[];
  encounterFilter: string[];
  logfileFilter: string[];
};

export const useLogViewerStore = defineStore("log-viewer", {
  state: (): State => ({
    viewerState: "loading",
    currentSessionName: "",
    currentEncounterName: "",
    sessions: [],
    computedSessions: [],
    encounterOptions: [],
    encounterFilter: [],
    logfileFilter: [],
  }),
  actions: {
    resetState() {
      this.viewerState = "loading";
      this.currentSessionName = "";
      this.currentEncounterName = "";
      this.sessions = [];
      this.computedSessions = [];
      this.encounterOptions = [];
      this.encounterFilter = [];
      this.logfileFilter = [];
    },
  },
});
