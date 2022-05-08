<template>
  <tr>
    <td class="td-class-img">

    </td>
    <td class="ellipsis"></td>
    <td class="text-center">

      <span class="ex">

      </span>
    </td>
    <td class="text-center">
    <span class="ex">%</span>
    </td>
    <td class="text-center">

    </td>
    <td class="text-center">

      <span class="ex">%</span>
    </td>
    <td class="text-center">

      <span class="ex">%</span>
    </td>
    <td class="text-center">

      <span class="ex">%</span>
    </td>
    <td class="text-center">

    </td>
    <div
      class="player-bar"
      :style="`
              width:100%;
              background:red}
              `"
    >
    </div>
  </tr>
</template>

<script setup>
import { computed } from "vue";
import { classes } from "../../constants/classes";

const props = defineProps({
  skill: Object
});
</script>
