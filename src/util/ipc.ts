export const appVersion = window.ipc.appVersion();

export function openExternal(url: string) {
  window.ipc.openExternal(url);
}
