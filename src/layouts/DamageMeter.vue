<template>
  <q-layout
    view="hHh lpr fFf"
    style="height: 100vh"
    class="shadow-2 rounded-borders overflow-hidden"
  >
    <q-header bordered class="bg-primary text-white q-electron-drag">
      <q-bar>
        <div>
          Damage {{ damageType === DamageTypeDealt ? "Dealt" : "Taken" }}
        </div>

        <q-space />

        <q-btn
          dense
          flat
          icon="format_size"
          @click="compactBars = !compactBars"
        >
          <q-tooltip>
            Toggle between compact damage bars and normal ones
          </q-tooltip>
        </q-btn>

        <q-btn
          dense
          flat
          icon="access_time"
          @click="toggleDamageNumberVisibility"
        >
          <q-tooltip> Toggle between damage number, dps and both. </q-tooltip>
        </q-btn>

        <q-btn dense flat icon="shield" @click="toggleDamageType">
          <q-tooltip>
            Toggle between damage dealt and taken statistics
          </q-tooltip>
        </q-btn>

        <q-btn dense flat icon="restart_alt" @click="requestSessionRestart">
          <q-tooltip> Restart session </q-tooltip>
        </q-btn>
      </q-bar>
    </q-header>

    <q-page-container class="overflow-hidden" style="position: relative">
      <q-page v-if="sortedPlayers.length === 0" class="info-box click-through">
        Attack some monsters!
      </q-page>
      <q-page v-else>
        <q-linear-progress
          v-for="player in sortedPlayers"
          :key="player.id"
          :color="getClassColor(player.class).backgroundColor"
          class="progress-bar click-through"
          :size="compactBars ? '24px' : '32px'"
          :value="getPercentage(player, 'top') / 100"
        >
          <div
            class="absolute-full flex items-center"
            :class="compactBars ? 'compact-bar' : ''"
          >
            <div class="bar-img-bg"></div>
            <img
              v-if="!compactBars"
              class="bar-img"
              :src="getClassImage(player.class)"
            />
            <span class="bar-text">{{ player.name }} ({{ player.class }})</span>
            <span class="bar-text bar-text-right">
              {{ getDamageText(player.damage, player.damageTaken) }}
              ({{ getPercentage(player, "total") }}%)
            </span>
          </div>
        </q-linear-progress>
      </q-page>
    </q-page-container>

    <q-footer bordered class="bg-primary text-white click-through">
      <q-bar>
        <div>
          Total:
          {{
            (damageType === DamageTypeDealt
              ? sessionState.damageStatistics.totalDamageDealt
              : sessionState.damageStatistics.totalDamageTaken
            ).toLocaleString()
          }}
        </div>
        <q-space />
        <div>
          {{ millisToMinutesAndSeconds(sessionDuration) }} ({{
            millisToMinutesAndSeconds(fightDuration)
          }})
        </div>
      </q-bar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from "vue";
import { availableClassImages, classColors } from "../constants/classes";
import { Notify } from "quasar";

let compactBars = ref(false);
let sessionDuration = ref(0);
let fightDuration = ref(0);

const DamageTypeDealt = Symbol("dealt");
const DamageTypeTaken = Symbol("taken");
let damageType = ref(DamageTypeDealt);
function toggleDamageType() {
  damageType.value =
    damageType.value === DamageTypeDealt ? DamageTypeTaken : DamageTypeDealt;
}

const DamageStyleNormal = Symbol("normal");
const DamageStyleDPS = Symbol("dps");
const DamageStyleBoth = Symbol("both");
let damageNumberVisibility = ref(DamageStyleNormal);
function toggleDamageNumberVisibility() {
  if (damageNumberVisibility.value === DamageStyleNormal)
    damageNumberVisibility.value = DamageStyleDPS;
  else if (damageNumberVisibility.value === DamageStyleDPS)
    damageNumberVisibility.value = DamageStyleBoth;
  else damageNumberVisibility.value = DamageStyleNormal;
}

let sessionState = reactive({
  players: [],
  startedOn: +new Date(),
  damageStatistics: {
    totalDamageDealt: 0,
    topDamageDealt: 0,
    totalDamageTaken: 0,
    topDamageTaken: 0,
  },
});
/* let sessionState = reactive({ //fake data
  players: [
    {
      id: 100,
      isUser: 1,
      name: "Test",
      damage: 500,
      damageTaken: 1000,
      class: "Artillerist",
    },
    {
      id: 100,
      isUser: 1,
      name: "Test2",
      damage: 111,
      damageTaken: 1534,
      class: "Bard",
    },
    {
      id: 100,
      isUser: 1,
      name: "Test3",
      damage: 222,
      damageTaken: 258,
      class: "Machinist",
    },
    {
      id: 100,
      isUser: 1,
      name: "Test4",
      damage: 333,
      damageTaken: 1746,
      class: "Destroyer",
    },
  ],
  startedOn: +new Date(),
  damageStatistics: {
    totalDamageDealt: 1166,
    topDamageDealt: 500,
    totalDamageTaken: 4538,
    topDamageTaken: 1746,
  },
}); */

const sortedPlayers = computed(() => {
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  return sessionState.players
    .filter((x) =>
      damageType.value === DamageTypeDealt ? x.damage > 0 : x.damageTaken > 0
    )
    .sort((a, b) =>
      damageType.value === DamageTypeDealt
        ? b.damage - a.damage
        : b.damageTaken - a.damageTaken
    );
});

function getPercentage(player, relativeTo) {
  let a = player.damage;
  if (damageType.value === DamageTypeTaken) a = player.damageTaken;

  let b;
  if (damageType.value === DamageTypeDealt) {
    if (relativeTo === "top") b = sessionState.damageStatistics.topDamageDealt;
    else b = sessionState.damageStatistics.totalDamageDealt;
  } else {
    if (relativeTo === "top") b = sessionState.damageStatistics.topDamageTaken;
    else b = sessionState.damageStatistics.totalDamageTaken;
  }

  return ((a / b) * 100).toFixed(1);
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

function getClassImage(className) {
  if (availableClassImages.includes(className))
    return new URL(`../assets/classes/${className}.png`, import.meta.url).href;

  return new URL(`../assets/classes/Warrior.png`, import.meta.url).href;
}

function getClassColor(className) {
  if (Object.keys(classColors).includes(className))
    return classColors[className];

  return {
    backgroundColor: "grey-10",
    foregroundColor: "#fff",
  };
}

function getDamageText(damage, damageTaken) {
  let a = damage;
  if (damageType.value === DamageTypeTaken) a = damageTaken;

  const dmg = a.toLocaleString();
  const dps = (a / (fightDuration.value / 1000)).toFixed(1).toLocaleString();
  let psText = damageType.value === DamageTypeDealt ? "DPS" : "TPS";

  if (damageNumberVisibility.value === DamageStyleNormal) {
    return dmg;
  } else if (damageNumberVisibility.value === DamageStyleDPS) {
    return `${dps} ${psText}`;
  } else {
    return `${dmg} (${dps} ${psText})`;
  }
}

function requestSessionRestart() {
  window.messageApi.send("window-to-main", { message: "soft-reset-session" });
}

onMounted(() => {
  window.messageApi.receive("pcap-on-state-change", (value) => {
    sessionState.players = Object.values(value.players);
    sessionState.damageStatistics = value.damageStatistics;
    sessionState.startedOn = value.startedOn;
    sessionState.fightStartedOn = value.fightStartedOn;
  });

  window.messageApi.receive("pcap-on-error", (value) => {
    Notify.create({
      message: value,
    });
  });

  setInterval(() => {
    sessionDuration.value = +new Date() - sessionState.startedOn;
    if (sessionState.fightStartedOn > 0)
      fightDuration.value = +new Date() - sessionState.fightStartedOn;
    else fightDuration.value = 0;
  }, 1000);
});
</script>

<style>
html,
body {
  background: rgb(18 18 18 / 66%) !important;
}
.click-through {
  pointer-events: none;
  user-select: none;
}
.overflow-hidden {
  overflow: hidden !important;
}
.info-box {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bar-img-bg {
  position: absolute;
  height: 100%;
  width: 52px;
  background-image: linear-gradient(
    to left,
    rgba(0, 0, 0, 0),
    rgb(0 0 0 / 50%) 90%
  );
}

.bar-img {
  width: 26px;
  z-index: 10;
  margin-left: 4px;
}

.bar-text {
  z-index: 10;
  color: white;
  text-shadow: 1px 1px #000;
  font-size: 16px;
  margin-left: 8px;
  margin-top: 4px;
}
.compact-bar > .bar-text {
  font-size: 13px;
}
.bar-text-right {
  margin-left: auto;
  margin-right: 8px;
}
.progress-bar {
  transition-property: top;
  transition-duration: 0.25s;
}
</style>
