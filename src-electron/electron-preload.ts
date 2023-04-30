import { MessageApi, StoreApi, WindowControlApi, appVersionApi } from "app/types";
import { IgnoreMouseEventsOptions, contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("messageApi", {
  send: (channel, data) => {
    const validChannels = ["window-to-main"];

    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const validChannels = [
      "updater-message",
      "pcap-on-message",
      "pcap-on-state-change",
      "pcap-on-reset-state",
      "on-settings-change",
      "parsed-logs-list",
      "parsed-log",
      "log-parser-status",
      "on-restore-from-taskbar",
      "shortcut-action",
      "selected-log-path-folder",
      "uploader-message",
    ];

    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, args) => func(args));
    }
  },
} satisfies MessageApi);

contextBridge.exposeInMainWorld("windowControlApi", {
  minimize: () => ipcRenderer.send("minimize"),
  toggleMaximize: () => ipcRenderer.send("toggleMaximize"),
  close: () => ipcRenderer.send("close"),
  hide: () => ipcRenderer.send("hide"),
  setIgnoreMouseEvents: (ignore: boolean, options: IgnoreMouseEventsOptions) =>
    ipcRenderer.send("setIgnoreMouseEvents", ignore, options),
} satisfies WindowControlApi);

contextBridge.exposeInMainWorld("helperApi", {
  getMeterDataPath: () => ipcRenderer.sendSync("get-meter-data-path"),
});

contextBridge.exposeInMainWorld("appVersion", {
  get: () => ipcRenderer.sendSync("appVersion"),
} satisfies appVersionApi);

contextBridge.exposeInMainWorld("store", {
  get: (key: string) => ipcRenderer.sendSync("store:get", key),
  set: (key: string, value: any) => ipcRenderer.sendSync("store:set", key, value),
  has: (key: string) => ipcRenderer.sendSync("store:has", key),
  reset: (key: string) => ipcRenderer.sendSync("store:reset", key),
  delete: (key: string) => ipcRenderer.sendSync("store:delete", key),
  clear: () => ipcRenderer.sendSync("store:clear"),
} satisfies StoreApi);
