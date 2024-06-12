export const assignEach: (section: string, value: string, settings: string[]) => { [setting: string]: string } = (
  section: string,
  value: string,
  settings: string[]
) => {
  const prefix = `VPCFG_${section}_`;
  return settings.map((setting) => ({ [prefix + setting]: value })).reduce((prev, curr) => Object.assign(prev, curr));
};

export const ALL_STRUCTURAL_INTEGRITY_MODIFIER_SETTINGS = [
  "wood",
  "stone",
  "iron",
  "hardWood",
  "marble",
  "ashstone",
  "ancient",
];

export const ALL_DURABILITY_SETTINGS = [
  "axes",
  "pickaxes",
  "hammer",
  "cultivator",
  "hoe",
  "weapons",
  "armor",
  "bows",
  "shields",
  "torch",
];

export const ALL_EXPERIENCE_SETTINGS = [
  "swords",
  "knives",
  "clubs",
  "polearms",
  "spears",
  "blocking",
  "axes",
  "bows",
  "elementalMagic",
  "bloodMagic",
  "unarmed",
  "pickaxes",
  "woodCutting",
  "crossbows",
  "jump",
  "sneak",
  "run",
  "swim",
  "fishing",
  "ride",
];

export const ALL_GATHERING_SETTINGS = [
  "wood",
  "fineWood",
  "coreWood",
  "elderBark",
  "yggdrasilWood",
  "stone",
  "blackMarble",
  "tinOre",
  "copperOre",
  "copperScrap",
  "ironScrap",
  "silverOre",
  "chitin",
  "feather",
  "grausten",
  "blackwood",
  "flametalOre",
  "proustitePowder",
];

export const ALL_PICKABLE_SETTINGS = [
  "edibles",
  "flowersAndIngredients",
  "materials",
  "valuables",
  "surtlingCores",
  "blackCores",
  "questItems",
];
