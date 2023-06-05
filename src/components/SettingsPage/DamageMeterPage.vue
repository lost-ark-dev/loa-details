<template>
  <q-list>
    <q-btn
      unelevated
      color="primary"
      label="Reset Window Position"
      style="margin-left: 16px; margin-top: 8px"
      @click="resetDamageMeterPosition"
    />

    <q-item-label header>Functionality</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.dontResetOnZoneChange" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Don't reset on zone changes</q-item-label>
        <q-item-label caption>
          If enabled, it will never reset the session automatically and it won't show pop-ups for it. It will only reset
          when 'Reset Session' is clicked.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.pauseOnPhaseTransition" />
      </q-item-section>

      <q-item-section>
        <q-item-label> Pause meter on raid wipes or phase transitions </q-item-label>
        <q-item-label caption>
          If enabled, it will try to pause whenever a boss dies, a new phase begins/ends or when the raid wipes.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.resetAfterPhaseTransition" />
      </q-item-section>

      <q-item-section>
        <q-item-label> Reset meter after raid wipes or phase transitions when new combat is detected </q-item-label>
        <q-item-label caption>
          If enabled, it will reset the current session after a combat event happens following a phase transition event
          (boss dies, raid wipes, etc).
          <br />
          Example: You wipe on Valtan, and re-enter. Once you or your allies attack, the meter will reset.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.autoMinimize" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Auto minimize</q-item-label>
        <q-item-label caption>
          Minimizes the damage meter after
          {{ settings.damageMeter.functionality.autoMinimizeTimer }}
          seconds of inactivitiy and will go back to it's non minimized state on combat.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.minimizeToTaskbar" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Minimize to taskbar</q-item-label>
        <q-item-label caption>
          Instead of "minimizing" the damage meter into a small box, minimize it into a taskbar making it completely
          invisible.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.displayEsther" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Display Esther</q-item-label>
        <q-item-label caption> Display Esther damage in "dmg" tab. </q-item-label>
      </q-item-section>
    </q-item>

    <q-item v-if="settings.damageMeter.functionality.displayEsther" tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.functionality.estherIncludeInTotal" />
      </q-item-section>
      <q-item-section>
        <q-item-label>Inlude Esther in Total damage</q-item-label>
        <q-item-label caption> Include Esther damage in total damage (table header) </q-item-label>
      </q-item-section>
    </q-item>
    <q-item tag="label">
      <q-item-section>
        <q-item-label>
          <div class="fake-player-bar" :style="'background:' + settings.damageMeter.functionality.estherColor">
            Nineveh
          </div>
          <span @click="settings.damageMeter.functionality.estherColor = '#c2fc03'"> Reset Esther color </span>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-input v-model="settings.damageMeter.functionality.estherColor" :rules="['anyColor']">
          <template #append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-color
                  :model-value="settings.damageMeter.functionality.estherColor"
                  @change="
                    (val) => {
                      settings.damageMeter.functionality.estherColor = val;
                    }
                  "
                />
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </q-item-section>
    </q-item>

    <q-item>
      <q-item-section side>
        <q-icon name="access_time" />
      </q-item-section>
      <q-item-section>
        <q-slider
          :model-value="settings.damageMeter.functionality.autoMinimizeTimer"
          :min="5"
          :max="180"
          label
          :label-value="`Auto minimize after ${settings.damageMeter.functionality.autoMinimizeTimer} seconds.`"
          label-always
          @change="
            (val) => {
              settings.damageMeter.functionality.autoMinimizeTimer = val;
            }
          "
        />
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-item-label>Name Display</q-item-label>
        <q-item-label caption> Choose how you'd like to display names on the damage meter. </q-item-label>
      </q-item-section>
      <q-item-section>
        <q-select v-model="nameDisplayModel" filled :options="nameDisplayOptions" />
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Design</q-item-label>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.design.compactDesign" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Compact Design</q-item-label>
        <q-item-label caption>
          Hides the header along with timer and total damages to create a smaller damage meter.
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.design.pinUserToTop" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Pin my bar on top</q-item-label>
        <q-item-label caption>
          Pins the current player's bar to the top regardless of the damage dealt/tanked.
          <br />Note: This won't work if you open the app mid-fight instead of opening it before the fight.
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-item tag="label">
      <q-item-section side top>
        <q-checkbox v-model="settings.damageMeter.design.transparency" />
      </q-item-section>

      <q-item-section>
        <q-item-label>Transparency</q-item-label>
        <q-item-label caption>
          Toggle window transparency. Disable if you experience issues inside VM. (Requires restart)
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
          :model-value="settings.damageMeter.design.opacity"
          :min="0.1"
          :max="1"
          :step="0.1"
          label
          :label-value="`Opacity: ${settings.damageMeter.design.opacity}`"
          label-always
          :markers="true"
          @change="
            (val) => {
              settings.damageMeter.design.opacity = val;
            }
          "
        />
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Header Tabs</q-item-label>

    <q-item v-for="tabName in (Object.keys(headerId) as Array<keyof typeof headerId>)" :key="tabName" tag="label">
      <q-item-section side top>
        <q-checkbox
          :model-value="headerInclude(tabName)"
          @update:model-value="
            (enabled) => {
              if (enabled) settings.damageMeter.header.push(tabName);
              else settings.damageMeter.header = settings.damageMeter.header.filter((t) => t !== tabName);
            }
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Show
          {{ headerId[tabName] }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-separator spaced />
    <q-item-label header>Tabs</q-item-label>

    <q-item v-for="tabName in Object.keys(tabId) as Array<keyof typeof tabId>" :key="tabName" tag="label">
      <q-item-section side top>
        <q-checkbox
          :model-value="tabsIncludes(tabName)"
          @update:model-value="
            (enabled) => {
              if (enabled) settings.damageMeter.tabs.push(tabName);
              else settings.damageMeter.tabs = settings.damageMeter.tabs.filter((t) => t !== tabName);
            }
          "
        />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          Show
          {{ tabId[tabName] }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <template v-for="buffFilterType of Object.keys(settings.damageMeter.buffFilter)" :key="buffFilterType">
      <q-separator spaced />
      <q-item-label header style="text-transform: capitalize"> {{ buffFilterType }} Buffs </q-item-label>
      <div class="row">
        <q-item v-for="[idx, name] of buffCategories.entries()" :key="idx" tag="label" class="col-3">
          <q-item-section side top> <q-checkbox v-model="buffDisplayModel[buffFilterType][idx]" /></q-item-section>

          <q-item-section>
            <q-item-label> Show {{ name }} </q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </template>
    <q-separator spaced />
    <q-item-label header>Classes</q-item-label>
    <q-item
      v-for="classId in Object.keys(classesId) as unknown as Array<keyof typeof classesId>"
      :key="classId"
      tag="label"
    >
      <q-item-section>
        <q-item-label>
          <div class="fake-player-bar container">
            <div class="fake-player-bar left" :style="`background: ${getClassColor(classId)};width: 75%`">
              You ({{ classesId[classId][0] }})
            </div>
            <div class="fake-player-bar right" :style="`background: ${getClassColor(classId)};opacity:0.5`"></div>
          </div>
          <span @click="settings.damageMeter.classes[classId] = classesId[classId][1]">
            Reset {{ classesId[classId][0] }} color
          </span>
        </q-item-label>
      </q-item-section>
      <q-item-section side>
        <q-input v-model="settings.damageMeter.classes[classId]" :rules="['anyColor']">
          <template #append>
            <q-icon name="colorize" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-color
                  :model-value="settings.damageMeter.classes[classId]"
                  @change="
                    (val) => {
                      settings.damageMeter.classes[classId] = val;
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

<script setup lang="ts">
import { classesId, headerId, tabId } from "app/shared";
import { getClassColor, headerInclude, settings, tabsIncludes } from "stores/settings";
import { onMounted, ref, watch } from "vue";

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
const buffCategories = ref([
  "Damage",
  "Crit",
  "Attack Speed",
  "Move Speed",
  "HP",
  "Defense",
  "Resource",
  "Cooldown",
  "Stagger",
  "Shield",
  "Any",
]);

const nameDisplayModel = ref("");
const buffDisplayModel = ref({ party: {}, self: {}, other: {} });

watch(nameDisplayModel, (newVal) => {
  settings.value.damageMeter.functionality.nameDisplay = newVal;
});

watch(
  buffDisplayModel,
  (newVal) => {
    for (const buffFilterType of Object.keys(settings.value.damageMeter.buffFilter)) {
      let val = 0;
      for (const catIdx in buffCategories.value) {
        if (buffCategories.value[catIdx] === "Any") {
          val += newVal[buffFilterType][catIdx] << 50;
        } else {
          val += newVal[buffFilterType][catIdx] << catIdx;
        }
      }
      settings.value.damageMeter.buffFilter[buffFilterType] = val;
    }
  },
  { deep: true }
);

function resetDamageMeterPosition() {
  window.messageApi.send("window-to-main", {
    message: "reset-damage-meter-position",
  });
}

onMounted(() => {
  nameDisplayModel.value = nameDisplayOptions.value.find(
    (x) => x.value === settings.value.damageMeter.functionality.nameDisplay
  );

  for (const buffFilterType of Object.keys(settings.value.damageMeter.buffFilter)) {
    for (const catIdx in buffCategories.value) {
      if (buffCategories.value[catIdx] === "Any") {
        buffDisplayModel.value[buffFilterType][catIdx] =
          ((settings.value.damageMeter.buffFilter[buffFilterType] >> 50) & 1) === 1;
      } else {
        buffDisplayModel.value[buffFilterType][catIdx] =
          ((settings.value.damageMeter.buffFilter[buffFilterType] >> catIdx) & 1) === 1;
      }
    }
  }
});
</script>

<style>
.fake-player-bar.container {
  display: flex;
}

.fake-player-bar.left {
  flex: 3;
}

.fake-player-bar.right {
  flex: 1;
}
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
  top: 0px;
  left: 0px;
}
</style>
