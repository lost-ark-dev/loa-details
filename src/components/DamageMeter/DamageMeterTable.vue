<template>
  <div class="damage-meter-table-wrapper" :style="wrapperStyle">
    <table class="damage-meter-table">
      <thead>
        <q-menu touch-position context-menu>
          <q-list dense style="min-width: 100px">
            <q-item
              v-for="tabName in Object.keys(
                settingsStore.settings.damageMeter.tabs
              )"
              :key="tabName"
              clickable
              @click="toggleTabDisplay(tabName)"
            >
              <q-item-section side>
                <q-icon
                  v-if="
                    settingsStore.settings.damageMeter.tabs[tabName].enabled
                  "
                  name="check"
                />
                <q-icon v-else name="close" />
              </q-item-section>
              <q-item-section>
                {{ settingsStore.settings.damageMeter.tabs[tabName].name }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <tr v-if="focusedPlayer === '#'">
          <th style="width: 26px"></th>
          <th style="width: 100%"></th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.deathTime.enabled"
            style="width: 48px"
          >
            Dead for
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
            style="width: 72px"
          >
            {{
              damageType === "dmg"
                ? "Damage"
                : damageType === "tank"
                ? "Tanked"
                : damageType === "heal"
                ? "Healed"
                : damageType === "shield"
                ? "Shielded"
                : ""
            }}
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
            style="width: 48px"
          >
            {{
              damageType === "dmg"
                ? "D"
                : damageType === "tank"
                ? "T"
                : damageType === "heal"
                ? "H"
                : damageType === "shield"
                ? "S"
                : ""
            }}%
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
            style="width: 52px"
          >
            {{
              damageType === "dmg"
                ? "DPS"
                : damageType === "tank"
                ? "TPS"
                : damageType === "heal"
                ? "HPS"
                : damageType === "shield"
                ? "SPS"
                : ""
            }}
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.critRate.enabled
            "
            style="width: 48px"
          >
            CRIT
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.faRate.enabled
            "
            style="width: 48px"
          >
            F.A.
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.baRate.enabled
            "
            style="width: 48px"
          >
            B.A.
          </th>
          <th
            v-if="
              damageType === 'dmg' &&
              settingsStore.settings.damageMeter.tabs.counterCount.enabled
            "
            style="width: 44px"
          >
            CNTR
          </th>
        </tr>
        <tr v-else-if="focusedPlayer !== '#'">
          <th style="width: 32px"></th>
          <th style="width: 100%"></th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damage.enabled"
            style="width: 72px"
          >
            Damage
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.damagePercent.enabled"
            style="width: 48px"
          >
            D%
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.dps.enabled"
            style="width: 52px"
          >
            DPS
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.critRate.enabled"
            style="width: 48px"
          >
            CRIT
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.faRate.enabled"
            style="width: 48px"
          >
            F.A.
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.baRate.enabled"
            style="width: 48px"
          >
            B.A.
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.maxDmg.enabled"
            style="width: 52px"
          >
            MaxDmg
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.avgDmg.enabled"
            style="width: 52px"
          >
            AvgDmg
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.totalHits.enabled"
            style="width: 52px"
          >
            TotalHits
          </th>
          <th
            v-if="settingsStore.settings.damageMeter.tabs.hpm.enabled"
            style="width: 52px"
          >
            Hits/m
          </th>
        </tr>
      </thead>
      <tbody
        v-if="
          (focusedPlayer === '#' && sortedEntities) ||
          (focusedPlayer !== '#' && sortedSkills.length === 0)
        "
      >
        <TableEntry
          v-for="player in sortedEntities"
          :key="player.id"
          :player="player"
          :damage-type="damageType"
          :fight-duration="Math.max(1000, duration)"
          :last-combat-packet="
            sessionState.lastCombatPacket ? sessionState.lastCombatPacket : 0
          "
          :name-display="nameDisplay"
          @click="focusPlayer(player)"
        />
      </tbody>
      <tbody
        v-else-if="
          focusedPlayer !== '#' && sortedSkills && sortedSkills.length > 0
        "
      >
        <SkillEntry
          v-for="skill in sortedSkills"
          :key="skill.name"
          :skill="skill"
          :class-name="focusedPlayerClass"
          :fight-duration="Math.max(1000, duration)"
          @click.right="focusedPlayer = '#'"
        />
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { cloneDeep } from "lodash";
import { useSettingsStore } from "src/stores/settings";

import TableEntry from "./TableEntry.vue";
import SkillEntry from "./SkillEntry.vue";

const settingsStore = useSettingsStore();

// TODO: move these to a pinia store
const props = defineProps({
  sessionState: Object,
  damageType: {
    type: String,
    default: "dmg",
  },
  duration: Number,
  wrapperStyle: String,
  nameDisplay: {
    type: String,
    default: "name+class",
  },
});
const entitiesCopy = ref([]);

function toggleTabDisplay(tabName) {
  settingsStore.settings.damageMeter.tabs[tabName].enabled =
    !settingsStore.settings.damageMeter.tabs[tabName].enabled;

  window.messageApi.send("window-to-main", {
    message: "save-settings",
    value: JSON.stringify(settingsStore.settings),
  });
}

watch(props, () => {
  sortEntities();
});
onMounted(() => {
  sortEntities();
});

const focusedPlayer = ref("#");
const focusedPlayerClass = ref("");
function focusPlayer(player) {
  focusedPlayer.value = player.name;
  focusedPlayerClass.value = player.class;
  calculateSkills();
}

const sortedEntities = ref([]);
const sortedSkills = ref([]);

function sortEntities() {
  if (Object.keys(props.sessionState).length <= 0) return;

  entitiesCopy.value = cloneDeep(Object.values(props.sessionState.entities));
  const res = entitiesCopy.value
    .filter((entity) => {
      if (!entity.isPlayer) return false;

      if (props.damageType === "dmg" && entity.damageDealt > 0) return true;
      else if (props.damageType === "tank" && entity.damageTaken > 0)
        return true;
      else if (props.damageType === "heal" && entity.healingDone > 0)
        return true;
      else if (props.damageType === "shield" && entity.shieldDone > 0)
        return true;

      return false;
    })
    .sort((a, b) => {
      if (settingsStore.settings.damageMeter.design.pinUserToTop) {
        if (a.name === "You") return -1e69;
        else if (b.name === "You") return 1e69; // nice
      }

      if (props.damageType === "dmg") return b.damageDealt - a.damageDealt;
      else if (props.damageType === "tank")
        return b.damageTaken - a.damageTaken;
      else if (props.damageType === "heal")
        return b.healingDone - a.healingDone;
      else if (props.damageType === "shield")
        return b.shieldDone - a.shieldDone;
      else return 0;
    });

  for (const entity of res) {
    entity.damagePercentageTotal = getPercentage(entity, "dmg", "total");
    entity.damagePercentageTop = getPercentage(entity, "dmg", "top");

    entity.tankPercentageTotal = getPercentage(entity, "tank", "total");
    entity.tankPercentageTop = getPercentage(entity, "tank", "top");

    entity.healPercentageTotal = getPercentage(entity, "heal", "total");
    entity.healPercentageTop = getPercentage(entity, "heal", "top");

    entity.shieldPercentageTotal = getPercentage(entity, "shield", "total");
    entity.shieldPercentageTop = getPercentage(entity, "shield", "top");

    let totalHitsWithBa = 0,
      totalHitsWithFa = 0;

    for (const skill of Object.values(entity.skills)) {
      if (skill.hits.backAttack / skill.hits.total >= 0.07)
        totalHitsWithBa += skill.hits.total;

      if (skill.hits.frontAttack / skill.hits.total >= 0.07)
        totalHitsWithFa += skill.hits.total;
    }

    entity.hits.totalHitsWithBa = totalHitsWithBa > 0 ? totalHitsWithBa : 1;
    entity.hits.totalHitsWithFa = totalHitsWithFa > 0 ? totalHitsWithFa : 1;
  }

  sortedEntities.value = res;
  calculateSkills();
}

function calculateSkills() {
  sortedSkills.value = [];
  if (focusedPlayer.value === "#") return;

  const entity = entitiesCopy.value.find((e) => {
    return e.name === focusedPlayer.value;
  });
  if (!entity) return;

  const res = Object.values(entity.skills).sort(
    (a, b) => b.totalDamage - a.totalDamage
  );

  for (const skill of res) {
    skill.damagePercent = (
      (skill.totalDamage / entity.damageDealt) *
      100
    ).toFixed(1);
    skill.relativePercent = (
      (skill.totalDamage / res[0].totalDamage) *
      100
    ).toFixed(1);
  }

  sortedSkills.value = res;
}

function getPercentage(player, dmgType, relativeTo) {
  let a = player.damageDealt;
  if (dmgType === "tank") a = player.damageTaken;
  else if (dmgType === "heal") a = player.healingDone;
  else if (dmgType === "shield") a = player.shieldDone;

  let b;
  if (dmgType === "dmg") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topDamageDealt;
    else b = props.sessionState.damageStatistics.totalDamageDealt;
  } else if (dmgType === "tank") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topDamageTaken;
    else b = props.sessionState.damageStatistics.totalDamageTaken;
  } else if (dmgType === "heal") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topHealingDone;
    else b = props.sessionState.damageStatistics.totalHealingDone;
  } else if (dmgType === "shield") {
    if (relativeTo === "top")
      b = props.sessionState.damageStatistics.topShieldDone;
    else b = props.sessionState.damageStatistics.totalShieldDone;
  }

  return ((a / b) * 100).toFixed(1);
}
</script>

<style>
.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.damage-meter-table-wrapper {
  overflow-y: scroll;
}
.damage-meter-table-wrapper::-webkit-scrollbar {
  display: none;
}
.damage-meter-table {
  font-family: "Segoe UI", "Segoe UI", "sans-serif";
  z-index: 100;
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.damage-meter-table thead {
  position: sticky;
  top: 0;
  background: black;
  z-index: 5000;
}
.damage-meter-table thead tr {
  color: rgb(189, 189, 189);
  font-size: 11px;
}
.damage-meter-table tbody tr {
  position: relative;
  height: 28px;
  color: #ffffff;
  font-size: 12px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
}
.damage-meter-table .ex {
  font-size: 10px;
  color: rgb(189, 189, 189);
}
.td-class-img,
.td-skill-img {
  background-image: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.5),
    rgba(0, 0, 0, 0)
  );
}
.td-class-img img {
  width: 16px;
  margin-left: 4px;
  margin-top: 4px;
}
.td-skill-img img {
  width: 20px;
  margin-left: 6px;
  margin-top: 4px;
}

.player-bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -100;
  opacity: 0.75;
  height: 28px;
  transition: 100ms;
}
</style>
