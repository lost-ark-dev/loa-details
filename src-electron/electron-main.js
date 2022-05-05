import { app, dialog, nativeTheme } from "electron";
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
        .connectTo(
          path.resolve(__dirname, "../../binary/Lost Ark Packet Capture.exe")
        )
        .build();
    } else {
      connection = new ConnectionBuilder()
        .connectTo("Lost Ark Packet Capture.exe")
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
  connection.on("data-v2", (value) => sessionState.onData(value));
  connection.on("error", (value) => sessionState.onError(value));
  connection.onDisconnect = () => {
    dialog.showErrorBox(
      "Error",
      "The connection to the Lost Ark Packet Capture was lost for some reason. Exiting app..."
    );

    console.log("Exiting app...");
    app.exit();
  };

  createMainWindow(mainWindow);
  createDamageMeterWindow(damageMeterWindow, store, sessionState);
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
