import { BrowserWindow } from "electron";
import path from "path";

export function createPrelauncherWindow() {
  const prelauncherWindow: BrowserWindow | null = new BrowserWindow({
    icon: path.resolve(__dirname, "icons/icon.png"),
    autoHideMenuBar: true,
    show: false,
    width: 300,
    height: 360,
    frame: false,
    resizable: false,
    fullscreenable: false,
    useContentSize: true,
    webPreferences: {
      devTools: process.env.DEBUGGING,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
  });

  prelauncherWindow.center();
  void prelauncherWindow
    .loadURL(process.env.APP_URL + "#/prelauncher")
    .then(() => {
      if (process.env.DEBUGGING) {
        // if on DEV or Production with debug enabled
        prelauncherWindow.webContents.openDevTools();
      } else {
        // we're on production; no access to devtools pls
        prelauncherWindow.webContents.on("devtools-opened", () => {
          prelauncherWindow.webContents.closeDevTools();
        });
      }
      prelauncherWindow.show();
    });

  return prelauncherWindow;
}
