import { contextBridge, ipcRenderer } from "electron";
import { BrowserWindow } from "@electron/remote";
import { MessageApi, WindowControlApi } from "app/types";

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
} as MessageApi);

contextBridge.exposeInMainWorld("windowControlApi", {
  minimize() {
    BrowserWindow.getFocusedWindow()?.minimize();
  },

  toggleMaximize() {
    const win = BrowserWindow.getFocusedWindow();

    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  },

  close() {
    BrowserWindow.getFocusedWindow()?.close();
  },

  hide() {
    BrowserWindow.getFocusedWindow()?.hide();
  },

  setIgnoreMouseEvents(ignore, options) {
    BrowserWindow.getFocusedWindow()?.setIgnoreMouseEvents(ignore, options);
  },
} as WindowControlApi);
