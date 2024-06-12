import VALHEIM_PLUS_OMEGA_QOL_ENV from "./valheim-plus-config-omega-qol";

const list = (section: string, settings: string[]) => settings.map((it) => `VPCFG_${section}_${it}`);

// assign some things back to unused
const toRemove = new Set<string>([
  ...list("Gathering", ["blackwood", "grausten", "blackMarble", "flametalOre", "proustitePowder"]),
  ...list("EitrUsage", ["enabled", "bloodMagic", "elementalMagic"]),
  ...list("HealthUsage", ["enabled", "bloodMagic"]),
  "VPCFG_Pickable_blackCores",
  ...list("ShieldGenerator", ["enabled", "infiniteFuel"]),
  ...list("Turret", ["enabled", "ignorePlayers", "projectileAccuracy"]),
]);
const entries = Object.entries(VALHEIM_PLUS_OMEGA_QOL_ENV).filter((entry) => !toRemove.has(entry[0]));
export default Object.fromEntries(entries);
