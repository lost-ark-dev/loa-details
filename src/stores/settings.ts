import { defineStore } from "pinia";
import { classes } from "../constants/classes";
import { ClassSettings, Settings } from "../../src-electron/util/app-settings";
import { StatusEffectBuffTypeFlags } from "meter-core/logger/data";
import { merge } from "lodash"; //TODO: when we rework, remove lodash (required for merge)

export const useSettingsStore = defineStore("store", {
  state: () => ({
    windows: window.storeApi.get("windows"),
    general: window.storeApi.get("general"),
    shortcuts: window.storeApi.get("shortcuts"),
    uploads: window.storeApi.get("uploads"),
    damageMeter: window.storeApi.get("damageMeter"),
    logs: window.storeApi.get("logs"),
  }),
  getters: {},
  actions: {
    reload() {
      this.windows = window.storeApi.get("windows");
      this.general = window.storeApi.get("general");
      this.shortcuts = window.storeApi.get("shortcuts");
      this.uploads = window.storeApi.get("uploads");
      this.damageMeter = window.storeApi.get("damageMeter");
      this.logs = window.storeApi.get("logs");
    },
    save() {
      window.storeApi.set("windows", this.windows);
      window.storeApi.set("general", this.general);
      window.storeApi.set("shortcuts", this.shortcuts);
      window.storeApi.set("uploads", this.uploads);
      window.storeApi.set("damageMeter", this.damageMeter);
      window.storeApi.set("logs", this.logs);
    },
  },
});
