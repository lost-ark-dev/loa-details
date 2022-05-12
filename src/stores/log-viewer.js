import { defineStore } from "pinia";

export const useLogViewerStore = defineStore("log-viewer", {
  state: () => ({
    currentEncounterIndex: 0,
  }),
  actions: {},
});
