import { app, dialog, nativeTheme, ipcMain } from "electron";
import { initialize } from "@electron/remote/main";
import { createMainWindow, createDamageMeterWindow } from "./windows";
import path from "path";
import os from "os";

initialize();

import { SessionState } from "./session-state";
const sessionState = new SessionState();

const Store = require("electron-store");
const store = new Store();

const { ConnectionBuilder } = require("electron-cgi");
let connection = null; // reserved for electron-cgi connection

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
    require("fs").unlinkSync(
      path.join(app.getPath("userData"), "DevTools Extensions")
    );
  }
} catch (_) {}

let mainWindow, damageMeterWindow;

app.whenReady().then(() => {
  try {
    if (process.env.DEBUGGING) {
      connection = new ConnectionBuilder()
        .connectTo(path.resolve(__dirname, "../../binary/LostArkLogger.exe"))
        .build();
    } else {
      connection = new ConnectionBuilder()
        .connectTo("LostArkLogger.exe")
        .build();
    }
  } catch (e) {
    dialog.showErrorBox(
      "Error while trying to open packet capturer",
      "Error: " + e.message
    );

    console.log("Exiting app...");
    app.exit();
  }

  connection.on("message", (value) => sessionState.onMessage(value));
  connection.on("new-zone", (value) => sessionState.onNewZone(value));
  connection.on("combat-event", (value) => sessionState.onCombatEvent(value));
  connection.onDisconnect = () => {
    dialog.showErrorBox(
      "Error",
      "The connection to the Lost Ark Packet Capture was lost for some reason. Exiting app..."
    );

    app.exit();
  };

  createMainWindow(mainWindow);
  createDamageMeterWindow(damageMeterWindow, store, sessionState);
});

ipcMain.on("window-to-main", (event, arg) => {
  if (arg.message === "reset-session") {
    sessionState.resetState();
  }
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow(mainWindow);
  }
});
