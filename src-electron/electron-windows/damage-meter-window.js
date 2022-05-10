import { BrowserWindow } from "electron";
import { enable } from "@electron/remote/main";
import Store from "electron-store";
import path from "path";

const store = new Store();

export function createDamageMeterWindow(damageMeterWindow, sessionState) {
  damageMeterWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    show: false,
    width: 512,
    height: 200,
    minWidth: 360,
    minHeight: 124,
    frame: false,
    transparent: true,
    resizable: true,
    autoHideMenuBar: true,
    fullscreenable: false,
    alwaysOnTop: true,
    useContentSize: true,
    webPreferences: {
      devTools: process.env.DEBUGGING,
      contextIsolation: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  enable(damageMeterWindow.webContents);
  damageMeterWindow.loadURL(process.env.APP_URL + "#/damage-meter").then(() => {
    damageMeterWindow.show();
  });
  damageMeterWindow.setAlwaysOnTop(true, "level");

  // Event listeners
  sessionState.addEventListenerWindow("message", damageMeterWindow);
  sessionState.addEventListenerWindow("stateChange", damageMeterWindow);
  sessionState.addEventListenerWindow("resetState", damageMeterWindow);

  const damageMeterWindow_w = store.get("damagemeter.width"),
    damagemeterWindow_h = store.get("damagemeter.height");
  if (damageMeterWindow_w && damagemeterWindow_h)
    damageMeterWindow.setSize(damageMeterWindow_w, damagemeterWindow_h);

  const damageMeterWindow_x = store.get("damagemeter.position.x"),
    damagemeterWindow_y = store.get("damagemeter.position.y");
  if (damageMeterWindow_x && damagemeterWindow_y)
    damageMeterWindow.setPosition(damageMeterWindow_x, damagemeterWindow_y);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    damageMeterWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    damageMeterWindow.webContents.on("devtools-opened", () => {
      damageMeterWindow.webContents.closeDevTools();
    });
  }

  damageMeterWindow.on("moved", () => {
    const curPos = damageMeterWindow.getPosition();
    store.set("damagemeter.position.x", curPos[0]);
    store.set("damagemeter.position.y", curPos[1]);

    // replayLogFile("test.log", sessionState); // this is only for debug purpouses
  });

  damageMeterWindow.on("resized", () => {
    const curSize = damageMeterWindow.getSize();
    store.set("damagemeter.width", curSize[0]);
    store.set("damagemeter.height", curSize[1]);
  });

  damageMeterWindow.on("closed", () => {
    damageMeterWindow = null;
  });

  return damageMeterWindow;
}

function replayLogFile(name, sessionState) {
  const fs = require("fs");
  const logdata = fs.readFileSync(
    path.resolve(__dirname, "../../logs/" + name),
    "utf8"
  );

  for (const line of logdata.split("\n")) {
    if (!line) continue;
    sessionState.onCombatEvent(line);
  }
}
