<template>
  <q-layout
    view="hHh lpr fFf"
    style="height: 100vh"
    class="shadow-2 rounded-borders overflow-hidden"
  >
    <q-header bordered class="bg-primary text-white q-electron-drag">
      <q-bar>
        <div>Damage Meter</div>

        <q-space />

        <q-btn dense flat icon="shield">
          <q-tooltip>
            Toggle between damage dealt and taken statistics
          </q-tooltip>
        </q-btn>

        <q-btn dense flat icon="restart_alt">
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
          size="32px"
          :value="
            getPercentage(
              player.damage,
              sessionState.damageStatistics.topDamageDealt
            ) / 100
          "
        >
          <div class="absolute-full flex items-center">
            <div class="bar-img-bg"></div>
            <img class="bar-img" :src="getClassImage(player.class)" />
            <span class="bar-text">{{ player.name }} ({{ player.class }})</span>
            <span class="bar-text-right">
              {{ player.damage.toLocaleString() }}
              ({{
                getPercentage(
                  player.damage,
                  sessionState.damageStatistics.totalDamageDealt
                )
              }}%)
            </span>
          </div>
        </q-linear-progress>
      </q-page>
    </q-page-container>

    <q-footer bordered class="bg-primary text-white click-through">
      <q-bar>
        <div>
          Total Damage:
          {{ sessionState.damageStatistics.totalDamageDealt.toLocaleString() }}
        </div>
        <q-space />
        <div>{{ millisToMinutesAndSeconds(sessionDuration) }}</div>
      </q-bar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { onMounted, reactive, computed, ref } from "vue";
import { getClassColor, availableClassImages } from "../constants/classes";

let sessionDuration = ref(0);
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

const sortedPlayers = computed(() => {
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  return sessionState.players
    .filter((x) => x.damage > 0)
    .sort((a, b) => b.damage - a.damage);
});

function getPercentage(damage, relativeTo) {
  return ((damage / relativeTo) * 100).toFixed(1);
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

onMounted(() => {
  window.messageApi.receive("pcap-on-state-change", (value) => {
    sessionState.players = Object.values(value.players);
    sessionState.damageStatistics = value.damageStatistics;
    sessionState.startedOn = value.startedOn;
  });

  setInterval(() => {
    sessionDuration.value = +new Date() - sessionState.startedOn;
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
}

.bar-text,
.bar-text-right {
  z-index: 10;
  color: white;
  text-shadow: 1px 1px #000;
  font-size: 16px;
  margin-left: 8px;
  margin-top: 4px;
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
