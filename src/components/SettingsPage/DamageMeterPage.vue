<template>
  <q-list>
    <q-item-label header>Functionality</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="
            settingsStore.settings.damageMeter.functionality
              .dontResetOnZoneChange
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Don't reset on zone changes</q-item-label>
        <q-item-label caption>
          If enabled, it will never reset the session automatically and it won't
          show pop-ups for it. It will only reset when 'Reset Session' is
          clicked.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="
            settingsStore.settings.damageMeter.functionality
              .pauseOnPhaseTransition
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Pause meter on raid wipes or phase transitions
        </q-item-label>
        <q-item-label caption>
          If enabled, it will try to pause whenever a boss dies, a new phase
          begins/ends or when the raid wipes.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="
            settingsStore.settings.damageMeter.functionality
              .resetAfterPhaseTransition
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Reset meter after raid wipes or phase transitions when new combat is
          detected
        </q-item-label>
        <q-item-label caption>
          If enabled, it will reset the current session after a combat event
          happens following a phase transition event (boss dies, raid wipes,
          etc).
          <br />
          Example: You wipe on Valtan, and re-enter. Once you or your allies
          attack, the meter will reset.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="
            settingsStore.settings.damageMeter.functionality.autoMinimize
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Auto minimize</q-item-label>
        <q-item-label caption>
          Minimizes the damage meter after
          {{
            settingsStore.settings.damageMeter.functionality.autoMinimizeTimer
          }}
          seconds of inactivitiy and will go back to it's non minimized state on
          combat.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="
            settingsStore.settings.damageMeter.functionality.minimizeToTaskbar
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Minimize to taskbar</q-item-label>
        <q-item-label caption>
          Instead of "minimizing" the damage meter into a small box, minimize it
          into a taskbar making it completely invisible.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item>
      <q-item-section side>
        <q-icon name="access_time" />
      </q-item-section>
      <q-item-section>
        <q-slider
          :model-value="
            settingsStore.settings.damageMeter.functionality.autoMinimizeTimer
          "
          @change="
            (val) => {
              settingsStore.settings.damageMeter.functionality.autoMinimizeTimer =
                val;
            }
          "
          :min="5"
          :max="180"
          label
          :label-value="`Auto minimize after ${settingsStore.settings.damageMeter.functionality.autoMinimizeTimer} seconds.`"
          label-always
        />
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="
            settingsStore.settings.damageMeter.functionality
              .removeOverkillDamage
          "
        />
      </q-item-section>
      <q-item-section>
        <q-item-label>Remove Overkill Damage</q-item-label>
        <q-item-label caption>
          If the last hit on a mob does more damage than it has HP remaining,
          remove the excess damage.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-item-label>Name Display</q-item-label>
        <q-item-label caption>
          Choose how you'd like to display names on the damage meter.
        </q-item-label>
      </q-item-section>
      <q-item-section>
        <q-select
          filled
          v-model="nameDisplayModel"
          :options="nameDisplayOptions"
        />
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Design</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.damageMeter.design.compactDesign"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Compact Design</q-item-label>
        <q-item-label caption>
          Hides the header along with timer and total damages to create a
          smaller damage meter.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.damageMeter.design.pinUserToTop"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Pin my bar on top</q-item-label>
        <q-item-label caption>
          Pins the current player's bar to the top regardless of the damage
          dealt/tanked.
          <br />Note: This won't work if you open the app mid-fight instead of
          opening it before the fight.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item-label header>Window Opacity</q-item-label>
    <q-item>
      <q-item-section side>
        <q-icon name="opacity" />
      </q-item-section>
      <q-item-section>
        <q-slider
          :model-value="settingsStore.settings.damageMeter.design.opacity"
          @change="
            (val) => {
              settingsStore.settings.damageMeter.design.opacity = val;
            }
          "
          :min="0.1"
          :max="1"
          :step="0.1"
          label
          :label-value="`Opacity: ${settingsStore.settings.damageMeter.design.opacity}`"
          label-always
          :markers="true"
        />
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Header Tabs</q-item-label>

    <q-item
      v-for="tabName in Object.keys(settingsStore.settings.damageMeter.header)"
      :key="tabName"
      tag="label"
    >
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.damageMeter.header[tabName].enabled"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Show
          {{ settingsStore.settings.damageMeter.header[tabName].name }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Tabs</q-item-label>

    <q-item
      v-for="tabName in Object.keys(settingsStore.settings.damageMeter.tabs)"
      :key="tabName"
      tag="label"
    >
      <q-item-section side top>
        <q-checkbox
          v-model="settingsStore.settings.damageMeter.tabs[tabName].enabled"
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Show
          {{ settingsStore.settings.damageMeter.tabs[tabName].name }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Classes</q-item-label>

    <q-item
      v-for="className in Object.keys(
        settingsStore.settings.damageMeter.classes
      )"
      :key="className"
      tag="label"
    >
      <q-item-section>
        <q-item-label>
          <div
            class="fake-player-bar"
            :style="
              'background:' +
              settingsStore.settings.damageMeter.classes[className].color
            "
          >
            You ({{ className }})
          </div>
          <span
            @click="
              settingsStore.settings.damageMeter.classes[className].color =
                settingsStore.settings.damageMeter.classes[
                  className
                ].defaultColor
            "
          >
            Reset {{ className }} color
          </span>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-input
          v-model="settingsStore.settings.damageMeter.classes[className].color"
          :rules="['anyColor']"
        >
          <template v-slot:append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy
                cover
                transition-show="scale"
                transition-hide="scale"
              >
                <q-color
                  :model-value="
                    settingsStore.settings.damageMeter.classes[className].color
                  "
                  @change="
                    (val) => {
                      settingsStore.settings.damageMeter.classes[
                        className
                      ].color = val;
                    }
                  "
                />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useSettingsStore } from "src/stores/settings";
const settingsStore = useSettingsStore();

const nameDisplayOptions = ref([
  {
    label: "Name + gear score + class, e.g. 'Eren (1580 Bard)'",
    value: "name+gear+class",
  },
  {
    label: "Name + class, e.g. 'Eren (Bard)'",
    value: "name+class",
  },
  {
    label: "Name + gear score, e.g. 'Eren (1580)'",
    value: "name+gear",
  },
  {
    label: "Class + gear score, e.g. 'Bard 1580'",
    value: "class+gear",
  },
  {
    label: "Name, e.g. 'Eren'",
    value: "name",
  },
  {
    label: "Gear score, e.g. '1580'",
    value: "gear",
  },
  {
    label: "Class, e.g. 'Bard'",
    value: "class",
  },
  {
    label: "Empty",
    value: "none",
  },
]);

var nameDisplayModel = ref("");

watch(nameDisplayModel, (newVal, oldVal) => {
  settingsStore.settings.damageMeter.functionality.nameDisplayV2 = newVal.value;
});

onMounted(() => {
  nameDisplayModel.value = nameDisplayOptions.value.find(
    (x) =>
      x.value === settingsStore.settings.damageMeter.functionality.nameDisplayV2
  );
});
</script>

<style>
.fake-player-bar {
  width: 100%;
  height: 28px;
  color: #ffffff;
  font-size: 12px;
  text-shadow: rgb(0 0 0) 0px 0px 0.3rem;
  display: flex;
  align-items: center;
  padding-left: 8px;
  margin-bottom: 8px;
}
</style>
