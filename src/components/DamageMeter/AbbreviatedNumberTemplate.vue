<template>
  <template v-if="hideZero && val === 0"> </template>
  <template v-else>
    {{ NumTxtHover[0] }}
    <span class="ex">
      {{ NumTxtHover[1] }}
    </span>
    <q-tooltip
      class="dmg_full_value"
      anchor="top middle"
      self="bottom middle"
      v-if="hover"
      >{{ NumTxtHover[2] }}</q-tooltip
    >
  </template>
</template>
<script setup lang="ts">
import { abbreviateNumber } from "src/util/number-helpers";
import { computed } from "vue";

const props = defineProps({
  val: { type: Number, required: true },
  hover: { type: Boolean, default: false },
  hideZero: { type: Boolean, default: false },
});

const NumTxtHover = computed(() => {
  return abbreviateNumber(props.val);
});
</script>
