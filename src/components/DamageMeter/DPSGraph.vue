<template>
  <v-chart
    class="dps-chart"
    :option="data"
    auto-resize
    :init-options="initOptions"
    theme="loa"
  />
</template>

<script setup lang="ts">
import { registerTheme, use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TitleComponent, TooltipComponent, MarkPointComponent } from "echarts/components";
import { onMounted, PropType, ref, watch } from "vue";
import { EChartsOption, SeriesOption } from "echarts";
import VChart from "vue-echarts";
import { Entity, Game } from "loa-details-log-parser/data";
import { EntityExtended } from "src/util/helpers";
import { useSettingsStore } from "stores/settings";
import { theme } from "components/DamageMeter/theme";
import PCData from "app/meter-data/databases/PCData.json";

registerTheme("loa", theme);
use([
  CanvasRenderer,
  LineChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  MarkPointComponent
]);
const props = defineProps({
  sessionState: { type: Object as PropType<Game>, required: true }
});
const settingsStore = useSettingsStore();

let entitiesCopy: EntityExtended[] = [];


const data = ref<EChartsOption>({});
const initOptions = ref({ renderer: "canvas" });
watch(props, () => prepare());
onMounted(() => prepare());

function generateIntervals(start?: number, end?: number) {
  if (!start || !end) return [];
  const duration = end - start;
  const intervals: number[] = [];
  const parts = duration / 5000;
  for (let i = 0; i <= Math.floor(parts); i++) {
    if (i === Math.floor(parts)) {
      intervals.push(parts * 5000);
    } else {
      intervals.push(i * 5000);
    }
  }
  return intervals;
}

function getDamage(start: number, end: number, entity: Entity) {
  const skills = Array.from(entity.skills.values());
  const damage = skills.reduce((acc, skill) => {
    const entries = skill.breakdown.filter(d => d.timestamp >= start && d.timestamp <= end);
    return acc + entries.reduce((acc, d) => acc + d.damage, 0);
  }, 0);
  if (!damage || isNaN(damage)) {
    return 0;
  }
  return damage;
}

function prepare() {
  const legend: string[] = [];
  const series: SeriesOption[] = [];
  const start = props.sessionState?.fightStartedOn ?? 0;
  const intervals = generateIntervals(start, props.sessionState?.lastCombatPacket);
  entitiesCopy = Array.from(props.sessionState?.entities.values()).filter(e => e.isPlayer && e.damageDealt > 0);
  entitiesCopy.sort((a, b) => a.damageDealt - b.damageDealt);
  entitiesCopy.forEach(e => {
    const markPoints: any[] = []
    legend.push(e.name);
    const data: string[] = [];
    let last = start
    intervals.forEach((i, index) => {
      const damage = getDamage(start, start + i, e);
      const dps = i > 0 ? damage / (i / 1000.0) : 0;
      data.push(dps.toFixed(0));
      if( e.deaths>0 && last<=e.deathTime && e.deathTime<=start+i ) {
        markPoints.push({
          name: "Death",
          value: "💀",
          coord: [index, dps],
        })
      }
      last = start+i
    });

    series.push({
      name: e.name,
      type: "line",
      color: settingsStore.getClassColor(e.class),
      markPoint:{data: markPoints},
      data
    });
  });
  data.value = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#6a7985"
        }
      }
    },
    legend: {
      data: legend,
      top: 25,
      type: "scroll"
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true

    },

    xAxis: [{
      type: "category",
      data: intervals.map(i => i / 1000),
      boundaryGap: false
    }],
    aria: {
      enabled: true,
      decal: {
        show: true
      }
    },
    yAxis: [
      {
        type: "value"
      }
    ],
    series
  };
}

function getClassImage(classId: number) {
  if (classId in PCData)
    return new URL(
      `../../assets/images/classes/${classId}.png`,
      import.meta.url
    ).href;

  return new URL("../../assets/images/classes/101.png", import.meta.url).href;
}
</script>
<style scoped>
.dps-chart {
  min-height: 300px !important;
}
</style>
