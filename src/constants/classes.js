export const availableClassImages = [
  "Arcanist",
  "Artillerist",
  "Assassin",
  "Bard",
  "Berserker",
  "Deadeye",
  "Destroyer",
  "Deathblade",
  "FemaleGunner",
  "Glavier",
  "Gunlancer",
  "Gunner",
  "Gunslinger",
  "Machinist",
  "Mage",
  "MaleMartialArtist",
  "MartialArtist",
  "Paladin",
  "Reaper",
  "Scrapper",
  "Shadowhunter",
  "Sharpshooter",
  "Sorceress",
  "Soreress",
  "Soulfist",
  "Striker",
  "Summoner",
  "Wardancer",
  "Warrior",
];

const classColors = {};
const possibleColors = [
  "pink",
  "purple",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "blue-grey",
];

let i = 6,
  j = 0;

for (const className of availableClassImages) {
  if (j === possibleColors.length - 1) {
    j = 0;
    i += 2;
  }

  classColors[className] = {
    backgroundColor: possibleColors[j] + "-" + i,
    foregroundColor: "#fff",
  };
  j++;
}

export function getClassColor(className) {
  if (!Object.keys(classColors).includes(className))
    return classColors[className];

  return {
    backgroundColor: "grey-10",
    foregroundColor: "#fff",
  };
}
