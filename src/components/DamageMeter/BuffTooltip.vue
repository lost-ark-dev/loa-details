<template>
  <q-tooltip class="buff-tooltip" anchor="top middle" self="bottom middle"
    >{{ skillData.class }}: <img :src="skillData.skillIcon" />
    {{ skillData.name }} (<img :src="skillData.buffIcon" />
    <span v-html="skillData.buffDesc"></span>)</q-tooltip
  >
</template>

<script setup>
import { onMounted, watch } from "vue";
import { QTooltip } from "quasar";
import Skills from "/meter-data/databases/Skill.json";
import SkillBuff from "/meter-data/databases/SkillBuff.json";
import PCData from "/meter-data/databases/PCData.json";

const props = defineProps({
  buffId: Number,
});

const skillData = {
  id: 0,
  valid: false,
  name: "",
  class: "",
  buffDesc: "",
  skillIcon: "../../assets/images/skills/unknown.png",
  buffIcon: "../../assets/images/skills/unknown.png",
};

watch(props, () => {
  grabData();
});

onMounted(() => {
  grabData();
});
function grabData() {
  //TODO: make sure this is only called when hovering & not every frame
  if (!props.buffId) {
    skillData.valid = false;
    return;
  }
  skillData.id = Math.floor(props.buffId / 100) * 10;
  const skill = Skills[skillData.id];
  const buff = SkillBuff[props.buffId];
  if (skill && buff) {
    skillData.name = skill.name;
    skillData.class = PCData[skill.classid];
    skillData.buffDesc = buff.desc;
    skillData.skillIcon = buff.icon
      ? `/meter-data/images/${skill.icon}`
      : "../../assets/images/skills/unknown.png";
    skillData.buffIcon = skill.icon
      ? `/meter-data/images/${buff.icon}`
      : "../../assets/images/skills/unknown.png";
    skillData.valid = true;
  }
}
</script>

<style>
.buff-tooltip {
  position: relative;
  background: #121519;
  font-size: 12px;
  text-shadow: rgb(0, 0, 0) 0px 0px 0.3rem;
}
.buff-tooltip img {
  width: 16px;
}
</style>
