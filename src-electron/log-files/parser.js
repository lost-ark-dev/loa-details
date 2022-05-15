import { cloneDeep } from "lodash";

// Some code taken from https://github.com/Marsunpaisti/LostArkLogVisualizer/blob/master/src/contexts/LogsContext.tsx
// with writers permission

const ENCOUNTER_SPLIT_THRESHOLD = 30000;

const classRegex = /(.*)( )\(([^)]+)\)/;

const entityTemplate = {
  name: "",
  class: "",
  isPlayer: false,
  damageDealt: 0,
  damageTaken: 0,
  skills: {},
  hits: {
    total: 0,
    crit: 0,
    backAttack: 0,
    frontAttack: 0,
    counter: 0,
  },
};

const skillTemplate = {
  name: "",
  useCount: 0,
  totalDamage: 0,
};

function disassembleEntityFromPacket(value) {
  const isPlayer = value.includes("("); // has class name

  if (isPlayer) {
    const player = classRegex.exec(value);
    return {
      name: player[1] || "Unknown Entity",
      class: player[3],
      isPlayer,
    };
  } else {
    return { name: value || "Unknown Entity", class: "", isPlayer };
  }
}

function createEncounter(
  parsedDamageInstances,
  startIndex,
  endIndex,
  encounterName
) {
  const game = {
    entities: {},
    damageStatistics: {
      totalDamageDealt: 0,
      topDamageDealt: 0,
      totalDamageTaken: 0,
      topDamageTaken: 0,
    },
  };

  const damageSlice = parsedDamageInstances.slice(startIndex, endIndex);
  for (const damageEvent of damageSlice) {
    const dmgOwner = disassembleEntityFromPacket(damageEvent.sourceEntity),
      dmgTarget = disassembleEntityFromPacket(damageEvent.targetEntity);

    if (!(dmgOwner.name in game.entities))
      game.entities[dmgOwner.name] = {
        ...cloneDeep(entityTemplate),
        ...dmgOwner,
      };

    if (!(dmgTarget.name in game.entities))
      game.entities[dmgTarget.name] = {
        ...cloneDeep(entityTemplate),
        ...dmgTarget,
      };

    if (
      dmgOwner.class &&
      dmgOwner.name in game.entities &&
      dmgOwner.class !== game.entities[dmgOwner.name].class
    ) {
      game.entities[dmgOwner.name].class = dmgOwner.class;
      game.entities[dmgOwner.name].isPlayer = true;
    }

    const skillName = damageEvent.abilityName || "Unknown";
    if (!(skillName in game.entities[dmgOwner.name].skills))
      game.entities[dmgOwner.name].skills[skillName] = {
        ...cloneDeep(skillTemplate),
        ...{ name: skillName },
      };

    let damage;
    try {
      damage = parseInt(damageEvent.damageValue);
    } catch {
      damage = 0;
    }

    const critCount = damageEvent.isCrit ? 1 : 0;
    const backAttackCount = damageEvent.isBackAttack ? 1 : 0;
    const frontAttackCount = damageEvent.isFrontalAttack ? 1 : 0;
    const counterCount = damageEvent.isCounterAttack ? 1 : 0;

    game.entities[dmgOwner.name].skills[skillName].totalDamage += damage;
    game.entities[dmgOwner.name].skills[skillName].useCount += 1;
    game.entities[dmgOwner.name].damageDealt += damage;

    game.entities[dmgTarget.name].damageTaken += damage;

    if (skillName !== "Bleed") {
      game.entities[dmgOwner.name].hits.total += 1;
      game.entities[dmgOwner.name].hits.crit += critCount;
      game.entities[dmgOwner.name].hits.backAttack += backAttackCount;
      game.entities[dmgOwner.name].hits.frontAttack += frontAttackCount;
      game.entities[dmgOwner.name].hits.counter += counterCount;
    }

    if (dmgOwner.isPlayer) {
      game.damageStatistics.totalDamageDealt += damage;
      game.damageStatistics.topDamageDealt = Math.max(
        game.damageStatistics.topDamageDealt,
        game.entities[dmgOwner.name].damageDealt
      );
    }

    if (dmgTarget.isPlayer) {
      game.damageStatistics.totalDamageTaken += damage;
      game.damageStatistics.topDamageTaken = Math.max(
        game.damageStatistics.topDamageTaken,
        game.entities[dmgTarget.name].damageTaken
      );
    }
  }

  let highestName = "";
  for (const entity of Object.values(game.entities)) {
    if (entity.damageTaken >= game.damageStatistics.topDamageTaken) {
      highestName = entity.name;
    }
  }

  // todo change this thing
  const firstTimestamp = parsedDamageInstances[0].timeStamp;
  const startMs =
    parsedDamageInstances[startIndex].timeStamp.getTime() -
    firstTimestamp.getTime();
  const startMinutes = Math.floor(startMs / 60000);
  const startSeconds = (startMs - 60000 * startMinutes) / 1000;
  const startTime = `${startMinutes}:${
    startSeconds.toFixed(0).length === 1 ? "0" : ""
  }${startSeconds.toFixed(0)}`;

  const endMs =
    parsedDamageInstances[endIndex - 1].timeStamp.getTime() -
    firstTimestamp.getTime();
  const endMinutes = Math.floor(endMs / 60000);
  const endSeconds = (endMs - 60000 * endMinutes) / 1000;
  const endTime = `${endMinutes}:${
    endSeconds.toFixed(0).length === 1 ? "0" : ""
  }${endSeconds.toFixed(0)}`;

  const encounterTimeInterval = `${startTime} - ${endTime}`;

  return {
    startIndex: startIndex,
    endIndex: endIndex,
    name: `${
      encounterName ? `${encounterName} (${highestName})` : highestName
    } ${encounterTimeInterval}`,
    duration: endMs - startMs,
    mostDamagedEntity: highestName,
    gameState: game,
  };
}

export function parseLogText(textContent) {
  if (!textContent) return;

  const parsedDamageInstances = [];

  const lines = textContent.split("\n").filter((x) => x != null && x != "");

  for (const line of lines) {
    // TODO: Replace logger seperator with |#|
    const lineSplit = line.split(",");
    if (lineSplit.length < 8) {
      continue;
    }

    const [
      timeStamp,
      sourceEntity,
      sourceEntityId,
      targetEntity,
      targetEntityId,
      abilityId,
      abilitySubId,
      abilityName,
      damageValue,
      healValue,
      shieldValue,
      staggerValue,
      isCrit,
      isBackAttack,
      isFrontalAttack,
      isCounterAttack,
    ] = lineSplit;

    const timeStampDate = new Date(timeStamp);

    const damageInstance = {
      timeStamp: timeStampDate,
      sourceEntity,
      targetEntity,
      abilityName,
      damageValue: Number(damageValue),
      isCrit: Number(isCrit) ? true : false,
      isBackAttack: Number(isBackAttack) ? true : false,
      isFrontalAttack: Number(isFrontalAttack) ? true : false,
      isCounterAttack: Number(isCounterAttack) ? true : false,
    };

    parsedDamageInstances.push(damageInstance);
  }

  parsedDamageInstances.sort(
    (a, b) => a.timeStamp.getTime() - b.timeStamp.getTime()
  );

  const encountersSplitted = [];

  // Add 'All' encounter
  encountersSplitted.push(
    createEncounter(
      parsedDamageInstances,
      0,
      parsedDamageInstances.length,
      "All"
    )
  );

  let encounterStartIndex = 0;
  for (let i = 1; i < parsedDamageInstances.length; i++) {
    const damageInstance = parsedDamageInstances[i];
    const previousInstance = parsedDamageInstances[i - 1];

    if (
      damageInstance.timeStamp.getTime() -
        previousInstance.timeStamp.getTime() >=
      ENCOUNTER_SPLIT_THRESHOLD
    ) {
      encountersSplitted.push(
        createEncounter(parsedDamageInstances, encounterStartIndex, i)
      );

      encounterStartIndex = i;
    }

    if (encounterStartIndex > 0 && i === parsedDamageInstances.length - 1) {
      encountersSplitted.push(
        createEncounter(parsedDamageInstances, encounterStartIndex, i)
      );
    }
  }

  return {
    encounters: encountersSplitted,
  };
}
