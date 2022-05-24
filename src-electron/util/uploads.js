import { getSettings } from "./app-settings";
import { Gzip } from "./compression";
import axios from "axios";
import { shell } from "electron";
import log from "electron-log";

export const getRecentLogs = () => {
  const settings = getSettings();
  const { uploadKey, apiUrl } = settings.uploads;

  return new Promise((resolve, reject) => {
    const request = {
      method: "POST",
      url: `${apiUrl}/logs/recent`,
      data: {
        key: uploadKey,
        range: { begin: +new Date() - 604799000 }
      },
      headers: {
        "Content-Type": "application/json",
      },
    }

    axios(request).then((response) => {
      settings.uploads.recentSessions = response.data;
      resolve(response.data);
    }).catch((error) => {
      log.debug(error);
      reject(error);
    });
  })
}


export const uploadSession = (state, session, compress = false) => {
  const settings = getSettings();
  const { uploadKey, apiUrl, loginUrl, uploadEndpoint, openOnUpload } = settings.uploads;
  return new Promise(async (resolve, reject) => {
    try {
      const apiKey = uploadKey;
      if (!apiKey || apiKey === "" || apiKey.length !== 32) {
        log.error("No upload key found");
        state.onMessage("pcap-on-message", { name: "session-upload", message: `Session Upload Failed`, failed: true });
        reject(new Error("Invalid API Key"));
      } else {
        const upload = JSON.stringify({ key: apiKey, data: session })
        const uploadUrl = apiUrl + uploadEndpoint;
        let httpOptions = {
          url: uploadUrl,
          method: "PUT",
          responseType: 'json',
          headers: {
            "Content-Type": "application/json",
            "Content-Length": upload.length,
          },
          data: upload,
        }

        if (compress) {
          const compressed = await Gzip.compressString(upload);
          httpOptions.headers = { 'Content-Type': 'application/octet-stream' };
          httpOptions.data = compressed
        }
        log.debug(`Uploading session`);

        axios(httpOptions).then((response) => {
          log.debug(`Uploaded session to ${uploadUrl}: ${JSON.stringify(response.data)}`);

          state.onMessage({ name: "session-upload", message: `Uploaded Session: ${loginUrl}/logs/${response.data.id}`});
          if (openOnUpload) shell.openExternal(`${loginUrl}/logs/${response.data.id}`);

          if (settings.uploads.recentSessions.length > 24) settings.uploads.recentSessions.shift();
          settings.uploads.recentSessions.push({ id: response.data.id, time: +Date.now() });
          getRecentLogs().then((logs) => {
            settings.uploads.recentSessions = logs;
            state.broadcastSettingsChange(settings);
          }).catch((logErr) => {
            log.debug(logErr);
          })
          resolve(response.data);
        }).catch((httpErr) => {
          log.error(httpErr);
          state.onMessage({ name: "session-upload", message: `Session Upload Failed`, failed: true });
          reject(new Error(`Failed to upload session`));
        })
      }
    } catch (uploadErr) {
      log.error(uploadErr);
      state.onMessage("pcap-on-message", { name: "session-upload", message: `Session Upload Failed`, failed: true });
      reject(new Error(`Failed to upload session: ${uploadErr.message}`));
    }
  })
}
