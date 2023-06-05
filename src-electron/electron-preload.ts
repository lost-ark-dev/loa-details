import { contextBridge, IgnoreMouseEventsOptions, ipcRenderer } from "electron";
import { ipc, MessageApi, Settings } from "shared/index";

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
} as MessageApi);

contextBridge.exposeInMainWorld("windowControlApi", {
  minimize: () => ipcRenderer.send("minimize"),
  toggleMaximize: () => ipcRenderer.send("toggleMaximize"),
  close: () => ipcRenderer.send("close"),
  hide: () => ipcRenderer.send("hide"),
  setIgnoreMouseEvents: (ignore: boolean, options: IgnoreMouseEventsOptions) =>
    ipcRenderer.send("setIgnoreMouseEvents", ignore, options),
});

contextBridge.exposeInMainWorld("helperApi", {
  getMeterDataPath: () => {
    return ipcRenderer.sendSync("get-meter-data-path") as string;
  },
});

const ipc: ipc = {
  getSettings: () => ipcRenderer.sendSync("ipc:getSettings") as Settings,
  onSettingsChanged: (fn) => ipcRenderer.on("ipc:settingsChanged", (event, arg: Settings) => fn(arg)),
  saveSettings: (settings: Settings) => ipcRenderer.send("ipc:saveSettings", settings),
  appVersion: () => ipcRenderer.sendSync("ipc:appVersion") as string,
  openExternal: (url: string) => ipcRenderer.send("ipc:openExternal", url),
};

contextBridge.exposeInMainWorld("ipc", ipc);
