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
            settingsStore.settings.damageMeter.functionality.autoMinimize
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>Auto Minimize</q-item-label>
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
          :min="15"
          :max="180"
          label
          :label-value="`Auto minimize after ${settingsStore.settings.damageMeter.functionality.autoMinimizeTimer} seconds.`"
          label-always
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
        <q-item-label
          >Show
          {{
            settingsStore.settings.damageMeter.tabs[tabName].name
          }}</q-item-label
        >
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
import { useSettingsStore } from "../../stores/settings";
const settingsStore = useSettingsStore();
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
