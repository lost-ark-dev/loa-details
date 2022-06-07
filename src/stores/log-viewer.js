import { defineStore } from "pinia";

export const useLogViewerStore = defineStore("log-viewer", {
  state: () => ({
    viewerState: "loading", // available: loading, no-data, none, viewing-session, viewing-log
    currentSessionName: null,
    currentEncounterName: null,
    sessions: [],
    encounterOptions: [],
    encounterFilter: null,
  }),
  actions: {
    resetState() {
      this.viewerState = "loading";
      this.currentSessionName = null;
      this.currentEncounterName = null;
      this.sessions = [];
      this.encounterOptions = [];
      encounterFilter: null;
    },
  },
});
