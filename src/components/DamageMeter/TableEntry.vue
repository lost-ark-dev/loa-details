<template>
  <tr>
    <td class="td-class-img">
      <img :src="getClassImage(player.class)" />
    </td>
    <td class="ellipsis">{{ player.name }} ({{ player.class }})</td>
    <td class="text-center">
      {{ numberFormat(DPS) }}
    </td>
    <td class="text-center">
      {{ player.percentageTotal }}<span class="ex">%</span>
    </td>
    <td class="text-center">
      {{ abbreviatedDamage[0] }}
      <span class="ex">
        {{ abbreviatedDamage[1] }}
      </span>
    </td>
    <td class="text-center">
      {{ ((player.hits.crit / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td class="text-center">
      {{ ((player.hits.frontAttack / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td class="text-center">
      {{ ((player.hits.backAttack / player.hits.total) * 100).toFixed(1) }}
      <span class="ex">%</span>
    </td>
    <td class="text-center">
      {{ player.hits.counter }}
    </td>
    <div
      class="player-bar"
      :style="`
              width:${player.percentageTop}%;
              background:${getClassColor(player.class)}
              `"
    >
      <!-- Player percentage bar -->
    </div>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { classes } from "../../constants/classes";

const props = defineProps({
  player: Object,
  showTanked: Boolean,
  fightDuration: Number,
});

const abbreviatedDamage = computed(() => {
  return abbreviateNumber(
    props.showTanked ? props.player.damageTaken : props.player.damageDealt
  );
});

const DPS = computed(() => {
  let a = props.player.damageDealt;
  if (props.showTanked) a = props.player.damageTaken;
  return (a / (props.fightDuration / 1000)).toFixed(0);
});

function numberFormat(n) {
  return new Intl.NumberFormat("en-US").format(n);
}

function abbreviateNumber(n) {
  if (n < 1e3) return [n, ""];
  if (n >= 1e3 && n < 1e6) return [+(n / 1e3).toFixed(1), "k"];
  if (n >= 1e6 && n < 1e9) return [+(n / 1e6).toFixed(1), "m"];
  if (n >= 1e9 && n < 1e12) return [+(n / 1e9).toFixed(1), "b"];
  if (n >= 1e12) return [+(n / 1e12).toFixed(1), "t"];
}

function getClassImage(className) {
  if (Object.keys(classes).includes(className))
    return new URL(`../../assets/classes/${className}.png`, import.meta.url)
      .href;

  return new URL(`../../assets/classes/Warrior.png`, import.meta.url).href;
}

function getClassColor(className) {
  if (Object.keys(classes).includes(className)) return classes[className].color;
  return "#353535";
}
</script>
