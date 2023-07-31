<template>
  <q-list>
    <q-item-label header>Log Uploads</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.settings.uploads.openOnUpload" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Open On Upload</q-item-label>
        <q-item-label caption>
          Enable to automatically open the uploaded session in your default
          browser.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.settings.uploads.uploadUnlisted" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Private Uploads</q-item-label>
        <q-item-label caption>
          Upload your encounters as unlisted. Unlisted encounters can only be
          viewed with a link.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settingsStore.settings.uploads.includeRegion" />
      </q-item-section>

      <q-item-section>
        <q-item-label
          >Include Game Region
          <q-badge color="blue">
            {{
              settingsStore.settings.general.server.replace(/./, (c) =>
                c.toUpperCase()
              )
            }}
          </q-badge>
        </q-item-label>
        <q-item-label caption>
          Include your game region in the upload. This value is taken
          automatically based on your current logger configuration.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item
      tag="label"
      :disable="settingsStore.settings.uploads.uploadKey.length !== 32"
    >
      <q-item-section side top>
        <q-checkbox
          :disable="settingsStore.settings.uploads.uploadKey.length !== 32"
          v-model="settingsStore.settings.uploads.uploadLogs"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Upload Logged DPS</q-item-label>
        <q-item-label caption>
          Enable to upload your sessions to the web. Requires the "Upload Key"
          to be set.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section left>
        <q-item-label>Upload Key</q-item-label>
        <q-item-label caption>
          An API key is required to upload logged sessions.<br />
          Login at
          <span
            @click="openSite(settingsStore.settings.uploads.site.value)"
            class="text-primary"
            style="cursor: pointer"
            >{{ settingsStore.settings.uploads.site.value }}</span
          >
          to get one.
        </q-item-label>
      </q-item-section>
      <q-item-section right>
        <q-input
          v-model="uploadKey"
          :type="isPwd ? 'password' : 'text'"
          label="API Key"
          clearable
          @clear="uploadKey = ''"
        >
          <template v-slot:append>
            <q-icon
              :name="isPwd ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwd = !isPwd"
            />
          </template>
        </q-input>
      </q-item-section>
    </q-item>

    <q-item
      :disable="settingsStore.settings.uploads.discordWebhook.length == 0"
      tag="label"
    >
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.uploads.uploadDiscord"
          :disable="settingsStore.settings.uploads.discordWebhook.length == 0"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Upload Screenshot to Discord
        </q-item-label>
        <q-item-label caption>
          Automatically upload a screenshot of the meter to a Discord webhook
          after each encounter.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section left>
        <q-item-label>Discord Webhook</q-item-label>
        <q-item-label caption>
          A Discord webhook URL to upload screenshots to.<br/>
          Go to a Discord Channel's settings, then "Integrations", then
          "Webhooks", then "New Webhook".
        </q-item-label>
      </q-item-section>
      <q-item-section right>
        <q-input
          v-model="discordWebhook"
          type=text
          label="Discord Webhook URL"
          clearable
          @clear="discordWebhook = ''"
        >
        </q-input>
      </q-item-section>
    </q-item>

    <q-item
      :disable="settingsStore.settings.uploads.discordWebhook.length == 0"
      tag="label"
    >
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.uploads.uploadDiscord"
          :disable="settingsStore.settings.uploads.discordWebhook.length == 0"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Upload Screenshot to Discord
        </q-item-label>
        <q-item-label caption>
          Automatically upload a screenshot of the meter to a Discord webhook
          after each encounter.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section left>
        <q-item-label>Discord Webhook</q-item-label>
        <q-item-label caption>
          A Discord webhook URL to upload screenshots to.<br/>
          Go to a Discord Channel's settings, then "Integrations", then
          "Webhooks", then "New Webhook".
        </q-item-label>
      </q-item-section>
      <q-item-section right>
        <q-input
          v-model="discordWebhook"
          type=text
          label="Discord Webhook URL"
          clearable
          @clear="discordWebhook = ''"
        >
        </q-input>
      </q-item-section>
    </q-item>

    <q-separator spaced />

    <q-item tag="label">
      <q-item-section side top>
        <q-btn
          unelevated
          color="negative"
          :label="`${showAdvanced ? 'Hide' : 'Show'} Advanced`"
          @click="showAdvanced = !showAdvanced"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>For users self-hosting logs</q-item-label>
        <q-item-label caption>
          Modifying any of the settings here may break uploads - careful!
        </q-item-label>
      </q-item-section>
    </q-item>

    <div v-if="showAdvanced" style="margin-top: 25px !important">
      <q-item tag="label" :clickable="false">
        <q-item-section left>
          <q-item-label>Upload Server&nbsp; </q-item-label>
          <q-item-label caption> URL to API server. </q-item-label>
        </q-item-section>
        <q-item-section right>
          <q-input
            v-model="settingsStore.settings.uploads.api.value"
            type="text"
            label="Upload Server"
            clearable
            clear-icon="refresh"
            @clear="resetURL('api')"
          >
          </q-input>
        </q-item-section>
      </q-item>

      <q-item tag="label" :clickable="false">
        <q-item-section left>
          <q-item-label>Upload Endpoint&nbsp; </q-item-label>
          <q-item-label caption>
            Endpoint for log uploads on API.
          </q-item-label>
        </q-item-section>
        <q-item-section right>
          <q-input
            v-model="settingsStore.settings.uploads.endpoint.value"
            type="text"
            label="Endpoint"
            clearable
            clear-icon="refresh"
            @clear="resetURL('endpoint')"
          >
          </q-input>
        </q-item-section>
      </q-item>

      <q-item tag="label" :clickable="false">
        <q-item-section left>
          <q-item-label>Frontend&nbsp; </q-item-label>
          <q-item-label caption> URL to frontend. </q-item-label>
        </q-item-section>
        <q-item-section right>
          <q-input
            v-model="settingsStore.settings.uploads.site.value"
            type="text"
            label="Frontend"
            clearable
            clear-icon="refresh"
            @clear="resetURL('site')"
          >
          </q-input>
        </q-item-section>
      </q-item>
    </div>
  </q-list>
</template>

<script setup>
/* eslint-disable */
import { onMounted, ref, watch } from "vue";
import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

const isPwd = ref(true);
const uploadKey = ref("");
const discordWebhook = ref("");
const showAdvanced = ref(false);

window.messageApi.receive("settings-changed", (value) => {
  settingsStore.loadSettings(value);
});

watch(uploadKey, (newVal, oldVal) => {
  if (newVal.length !== 32) settingsStore.settings.uploads.uploadLogs = false;
  settingsStore.settings.uploads.uploadKey = newVal;
});

watch(discordWebhook, (newVal, oldVal) => {
  if (newVal.length == 0) settingsStore.settings.uploads.uploadDiscord = false;
  settingsStore.settings.uploads.discordWebhook = newVal;
});

onMounted(() => {
  uploadKey.value = settingsStore.settings.uploads.uploadKey;
  discordWebhook.value = settingsStore.settings.uploads.discordWebhook;
});
/**
 * @param {'api' | 'site' | 'endpoint'} type
 */
function resetURL(type) {
  settingsStore.settings.uploads[type].value =
    settingsStore.settings.uploads[type].defaultValue;
}

function openSite(url) {
  window.messageApi.send("window-to-main", {
    message: "open-link",
    value: url,
  });
}
</script>
