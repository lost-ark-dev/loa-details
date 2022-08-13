export function tryParseInt(intString, defaultValue = 0) {
  if (typeof intString === "number") {
    if (isNaN(intString)) return defaultValue;
    return intString;
  }

  let intNum;

  try {
    intNum = parseInt(intString);
    if (isNaN(intNum)) intNum = defaultValue;
  } catch {
    intNum = defaultValue;
  }

  return intNum;
}

export const getClassIdFromName = (name) => {
  if (name === "Warrior") return 101;
  if (name === "Mage") return 201;
  if (name === "MartialArtist") return 301;
  if (name === "MaleMartialArtist") return 311;
  if (name === "Assassin") return 401;
  if (name === "Gunner") return 501;
  if (name === "Female Gunner") return 511;
  if (name === "Specialist") return 601;
  if (name === "Berserker") return 102;
  if (name === "Destroyer") return 103;
  if (name === "Gunlancer") return 104;
  if (name === "Paladin") return 105;
  if (name === "Arcana") return 202;
  if (name === "Summoner") return 203;
  if (name === "Bard") return 204;
  if (name === "Sorceress") return 205;
  if (name === "Wardancer") return 302;
  if (name === "Scrapper") return 303;
  if (name === "Soulfist") return 304;
  if (name === "Glaivier") return 305;
  if (name === "Glavier") return 305;
  if (name === "Striker") return 312;
  if (name === "Deathblade") return 402;
  if (name === "Shadowhunter") return 403;
  if (name === "Reaper") return 404;
  if (name === "Sharpshooter") return 502;
  if (name === "Deadeye") return 503;
  if (name === "Artillerist") return 504;
  if (name === "Scouter") return 505;
  if (name === "Gunslinger") return 512;
  if (name === "Artist") return 602;
  if (name === "Aeromancer") return 603;

  return 0;
};

export const guardians = [
  509006, 512002, 512004, 512006, 512008, 512009, 512011, 512012, 512013,
  512014, 512015, 512016, 512017, 512019, 512020, 512022, 512023, 512025,
  512027, 593007, 593017, 620010, 620020, 620030, 620040, 620050, 620051,
  620052, 620060, 620061, 620070, 620071, 620080, 620100, 620110, 620140,
  620145, 620146, 620150, 620170, 620180, 620190, 620200, 620210, 620220,
  620230, 620237, 620238, 620240, 620241, 620242, 620260, 622010, 622020,
  622030, 622040, 622050, 622060, 622070, 622080, 622090, 622100, 622110,
  622120, 622130, 622140, 622150, 622160, 622170, 622190, 622200, 623031,
  623070, 624010, 624020, 624021, 624030, 624140, 630020, 630110, 630120,
  630210, 630220, 630310, 630320, 630330, 630410, 630420, 630510, 630520,
  630530, 630610, 630620, 630810, 630820, 630830, 630910, 630920, 630930,
  631810, 631820, 631830, 632610, 632620, 632630, 632710, 632720, 632730,
  632810, 632820, 632830, 632910, 632920, 632930, 633210, 633220, 633230,
  633310, 633320, 633330, 633410, 633420, 633430, 633510, 633520, 633530,
  633610, 633620, 633630, 633710, 633720, 633730, 633810, 633820, 633830,
  633840, 634110, 634120, 634130, 634140, 634150, 634160, 634170, 634180,
  634190, 634200, 634210, 634220, 634230, 634240, 634250, 720011, 620290,
  620295, 620160, 620250, 620270, 622210, 630030, 620281, 620280,
];
