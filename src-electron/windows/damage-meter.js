import { BrowserWindow } from "electron";
import { enable } from "@electron/remote/main";
import path from "path";

export function createDamageMeterWindow(
  damageMeterWindow,
  store,
  sessionState
) {
  damageMeterWindow = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    autoHideMenuBar: true,
    width: 512,
    height: 200,
    frame: false,
    transparent: true,
    resizable: true,
    minWidth: 430,
    minHeight: 124,
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
  damageMeterWindow.loadURL(process.env.APP_URL + "#/damage-meter");
  damageMeterWindow.setAlwaysOnTop(true, "level");

  // Event listeners
  sessionState.addEventListenerWindow("message", damageMeterWindow);
  sessionState.addEventListenerWindow("stateChange", damageMeterWindow);

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
    store.set("damagemeter.position.x", damageMeterWindow.getPosition()[0]);
    store.set("damagemeter.position.y", damageMeterWindow.getPosition()[1]);
  });

  damageMeterWindow.on("closed", () => {
    damageMeterWindow = null;
  });
}
