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

    <q-item
      tag="label"
      :disable="
        settingsStore.settings.uploads.uploadKey.length < 32 ||
        settingsStore.settings.uploads.uploadKey.length > 32
      "
    >
      <q-item-section side top>
        <q-checkbox
          :disable="
            settingsStore.settings.uploads.uploadKey.length < 32 ||
            settingsStore.settings.uploads.uploadKey.length > 32
          "
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
            @click="openSite(settingsStore.settings.uploads.loginUrl)"
            class="text-primary"
            style="cursor: pointer"
            >{{ settingsStore.settings.uploads.loginUrl }}</span
          >
          to get one.
        </q-item-label>
      </q-item-section>
      <q-item-section right>
        <q-input
          v-model="uploadKey"
          :type="isPwd ? 'password' : 'text'"
          label="API Key"
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

    <q-item-label header>Server Selection</q-item-label>

    <q-item tag="label">
      <q-item-section side>
        <q-item-label>Region</q-item-label>
      </q-item-section>
      <q-item-section>
        <q-select
          filled
          :hide-bottom-space="true"
          :clearable="true"
          v-model="selectedRegion"
          :options="regions"
          :dense="true"
          :square="true"
        >
        </q-select>
      </q-item-section>

      <q-item-section side>
        <q-item-label>Server&nbsp;&nbsp;</q-item-label>
      </q-item-section>
      <q-item-section>
        <q-select
          filled
          :hide-bottom-space="true"
          :clearable="true"
          v-model="selectedServer"
          :options="servers[settingsStore.settings.uploads.region]"
          :dense="true"
          :square="true"
        >
        </q-select>
      </q-item-section>
    </q-item>

    <q-item-label header
      >Recent Uploads
      <small>The last 10 sessions uploaded to the web.</small></q-item-label
    >

    <q-item>
      <q-item-section v-if="recentSessions.length === 0">
        <q-item>
          <span>No Recent Sessions</span>
        </q-item>
      </q-item-section>
      <q-item-section v-else>
        <q-item
          v-for="session in recentSessions.sort(
            (a, b) => b.createdAt - a.createdAt
          )"
          :key="session.id"
          :session="session"
        >
          <q-item-section>
            <q-btn
              color="primary"
              @click="
                openSite(
                  `${settingsStore.settings.uploads.loginUrl}/logs/${session.id}`
                )
              "
            >
              {{ session.id || "Invalid ID" }}
            </q-btn>
          </q-item-section>
          <q-item-section>
            <span>
              &nbsp; Uploaded:
              {{
                new Intl.DateTimeFormat("en-US", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                }).format(new Date(session.createdAt))
              }}</span
            >
          </q-item-section>
        </q-item>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

const selectedRegion = ref("");
const selectedServer = ref("");
const recentSessions = ref([]);

// TODO: move this to constants once (if) the uploader becomes available
const regions = [
  {
    label: "NA West",
    value: "na_west",
  },
  {
    label: "NA East",
    value: "na_east",
  },
  {
    label: "EU Central",
    value: "eu_central",
  },
  {
    label: "EU West",
    value: "eu_west",
  },
  {
    label: "South America",
    value: "sa",
  },
  {
    label: "Korea",
    value: "kr",
  },
  {
    label: "Russia",
    value: "ru",
  },
];

const servers = {
  na_west: [
    {
      label: "Mari",
      value: "mari",
    },
    {
      label: "Akkan",
      value: "akkan",
    },
    {
      label: "Rohendel",
      value: "rohendel",
    },
    {
      label: "Valtan",
      value: "valtan",
    },
    {
      label: "Bergstrom",
      value: "bergstrom",
    },
    {
      label: "Enviska",
      value: "enviska",
    },
    {
      label: "Shandi",
      value: "shandi",
    },
  ],
  na_east: [
    {
      label: "Azena",
      value: "azena",
    },
    {
      label: "Una",
      value: "una",
    },
    {
      label: "Regulus",
      value: "regulus",
    },
    {
      label: "Avesta",
      value: "avesta",
    },
    {
      label: "Galatur",
      value: "galatur",
    },
    {
      label: "Karta",
      value: "karta",
    },
    {
      label: "Ladon",
      value: "ladon",
    },
    {
      label: "Kharmine",
      value: "kharmine",
    },
    {
      label: "Elzowin",
      value: "elzowin",
    },
    {
      label: "Sasha",
      value: "sasha",
    },
    {
      label: "Adrinne",
      value: "adrinne",
    },
    {
      label: "Aldebaran",
      value: "aldebaran",
    },
    {
      label: "Zosma",
      value: "zosma",
    },
    {
      label: "Vykas",
      value: "vykas",
    },
    {
      label: "Danube",
      value: "danube",
    },
  ],
  eu_central: [
    {
      label: "Neria",
      value: "neria",
    },
    {
      label: "Kadan",
      value: "kadan",
    },
    {
      label: "Trixion",
      value: "trixion",
    },
    {
      label: "Calvasus",
      value: "calvasus",
    },
    {
      label: "Thirain",
      value: "thirain",
    },
    {
      label: "Zinnervale",
      value: "zinnervale",
    },
    {
      label: "Asta",
      value: "asta",
    },
    {
      label: "Wei",
      value: "wei",
    },
    {
      label: "Slen",
      value: "slen",
    },
    {
      label: "Sceptrum",
      value: "sceptrum",
    },
    {
      label: "Procyon",
      value: "procyon",
    },
    {
      label: "Beatrice",
      value: "beatrice",
    },
    {
      label: "Inanna",
      value: "inanna",
    },
    {
      label: "Thaemine",
      value: "thaemine",
    },
    {
      label: "Sirius",
      value: "sirius",
    },
    {
      label: "Antares",
      value: "antares",
    },
    {
      label: "Brelshaza",
      value: "brelshaza",
    },
    {
      label: "Nineveh",
      value: "nineveh",
    },
    {
      label: "Mokoko",
      value: "mokoko",
    },
  ],
  eu_west: [
    {
      label: "Rethramis",
      value: "rethramis",
    },
    {
      label: "Tortoyk",
      value: "tortoyk",
    },
    {
      label: "Moonkeep",
      value: "moonkeep",
    },
    {
      label: "Stonehearth",
      value: "stonehearth",
    },
    {
      label: "Shadespire",
      value: "shadespire",
    },
    {
      label: "Tragon",
      value: "tragon",
    },
    {
      label: "Petrania",
      value: "petrania",
    },
    {
      label: "Punika",
      value: "punika",
    },
  ],
  sa: [
    {
      label: "Kazeros",
      value: "kazeros",
    },
    {
      label: "Agaton",
      value: "agaton",
    },
    {
      label: "Gienah",
      value: "gienah",
    },
    {
      label: "Arcturus",
      value: "arcturus",
    },
    {
      label: "Yorn",
      value: "yorn",
    },
    {
      label: "Feiton",
      value: "feiton",
    },
    {
      label: "Vern",
      value: "vern",
    },
    {
      label: "Kurzan",
      value: "kurzan",
    },
    {
      label: "Prideholme",
      value: "prideholme",
    },
  ],
  kr: [],
  ru: [],
};

const isPwd = ref(true);
const uploadKey = ref(settingsStore.settings.uploads.uploadKey);

window.messageApi.receive("settings-changed", (value) => {
  settingsStore.loadSettings(value);
});

watch(uploadKey, (newVal, oldVal) => {
  if (newVal.length !== 32) settingsStore.settings.uploads.uploadLogs = false;

  settingsStore.settings.uploads.uploadKey = newVal;
});

watch(selectedRegion, (newVal, oldVal) => {
  settingsStore.settings.uploads.region = !newVal ? "" : newVal.value;

  if (!newVal || (newVal && oldVal)) selectedServer.value = "";
});

watch(selectedServer, (newVal, oldVal) => {
  settingsStore.settings.uploads.server = !newVal ? "" : newVal.value;
});

onMounted(() => {
  selectedRegion.value = regions.find(
    (x) => x.value === settingsStore.settings.uploads.region
  );
  const serverSection = servers[settingsStore.settings.uploads.region];
  selectedServer.value = !serverSection
    ? ""
    : serverSection.find(
        (x) => x.value === settingsStore.settings.uploads.server
      );

  recentSessions.value = settingsStore.settings.uploads.recentSessions;
});

function openSite(url) {
  window.messageApi.send("window-to-main", {
    message: "open-link",
    value: url,
  });
}
</script>
