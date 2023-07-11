export default {
  // Valheim plus options as env config...
  VPCFG_Server_enabled: "true", // enable V+, server syncing of configs, and enforcing v+ installations
  VPCFG_Server_enforceMod: "true",

  VPCFG_Bed_enabled: "true", // enable ability to sleep on bed without claiming spawn

  VPCFG_Beehive_enabled: "true",
  VPCFG_Beehive_honeyProductionSpeed: "60", // usually 1200
  VPCFG_Beehive_maximumHoneyPerBeehive: "4", // usually 4
  VPCFG_Beehive_showDuration: "true", // show mins/secs to next honey
  VPCFG_Beehive_autoDeposit: "true", // auto deposit into chests within 10 units

  VPCFG_Building_enabled: "true",
  VPCFG_Building_noInvalidPlacementRestriction: "true", // place objects into other objects
  VPCFG_Building_noWeatherDamage: "true", // rain doesn't decay
  VPCFG_Building_maximumPlacementDistance: "20", // place things 4x further away
  VPCFG_Building_pieceComfortRadius: "40", // 4x distance for comfort affecting furnature
  VPCFG_Building_alwaysDropResources: "true", // always refund the refundable resources on manual destruction
  VPCFG_Building_alwaysDropExcludedResourcess: "true", // always refund the non-refundable resources on manual destruction
  VPCFG_Building_enableAreaRepair: "true", // repair with hammer works on a radius
  VPCFG_Building_areaRepairRadius: "10",

  VPCFG_Camera_enabled: "true",
  VPCFG_Camera_cameraMaximumZoomDistance: "9", // 1.5x zoom out
  VPCFG_Camera_cameraBoatMaximumZoomDistance: "18", // triple zoom out on boats

  VPCFG_CraftFromChest_enabled: "true", // craft from chests/carts/ships around your nearest workbench
  VPCFG_CraftFromChest_range: "30",

  VPCFG_EitrRefinery_enabled: "true",
  VPCFG_EitrRefinery_maximumSap: "200", // usually 20
  VPCFG_EitrRefinery_maximumSoftTissue: "200", // usually 20
  VPCFG_EitrRefinery_productionSpeed: "1", // usually 40 seconds
  VPCFG_EitrRefinery_autoDeposit: "true", // place result in nearby chest
  VPCFG_EitrRefinery_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_EitrRefinery_autoRange: "3",

  VPCFG_Fermenter_enabled: "true",
  VPCFG_Fermenter_showDuration: "true", // show mins/secs to finishing
  VPCFG_Fermenter_fermenterDuration: "60", // usually 2400 seconds
  VPCFG_Fermenter_fermenterItemsProduced: "15", // ususally 6
  VPCFG_Fermenter_autoFuel: "true", // looks in nearby chest for mead base
  VPCFG_Fermenter_autoDeposit: "true",
  VPCFG_Fermenter_autoRange: "3",

  VPCFG_FireSource_enabled: "true",
  VPCFG_FireSource_autoFuel: "true", // looks in nearby chest for wood
  VPCFG_FireSource_autoRange: "3",
  VPCFG_FireSource_torches: "true", // stays full
  VPCFG_FireSource_fires: "true", // stays full

  VPCFG_Food_enabled: "true",
  VPCFG_Food_foodDurationMultiplier: "900", // 10x
  VPCFG_Food_disableFoodDegradation: "true", // max health/stam increase until time runs out

  VPCFG_Furnace_enabled: "true",
  VPCFG_Furnace_maximumOre: "100", // usually 10
  VPCFG_Furnace_maximumCoal: "100", // usually 20
  VPCFG_Furnace_coalUsedPerProduct: "1", // usually 2
  VPCFG_Furnace_productionSpeed: "1", // usually 30
  VPCFG_Furnace_autoDeposit: "true", // place result in nearby chest
  VPCFG_Furnace_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_Furnace_autoRange: "3",

  VPCFG_Game_enabled: "true",
  VPCFG_Game_disableFog: "false", // seems monumental to mistlands
  VPCFG_Game_bigPortalNames: "true",

  VPCFG_GameClock_enabled: "true",
  VPCFG_GameClock_useAMPM: "true",

  VPCFG_Gathering_enabled: "true", // see bottom for rates
  VPCFG_Gathering_dropChance: "4900", // 50x drop chance

  VPCFG_GridAlignment_enabled: "true", // global grid alignment when building using left alt

  VPCFG_HUD_enabled: "true",
  VPCFG_HUD_showRequiredItems: "true", // show amount of items available while crafting
  VPCFG_HUD_displayBowAmmoCounts: "2", // show ammo count always
  VPCFG_HUD_experienceGainedNotifications: "true", // show ammo count

  VPCFG_Inventory_enabled: "true",
  VPCFG_Inventory_playerInventoryRows: "6", // usually 4
  VPCFG_Inventory_mergeWithExistingStacks: "true", // merge stacks when possible when picking up tombstone
  VPCFG_Inventory_woodChestRows: "3", // usually 2
  VPCFG_Inventory_woodChestColumns: "5", // usually 5
  VPCFG_Inventory_ironChestRows: "5", // usually 4
  VPCFG_Inventory_ironChestColumns: "6", // usually 6
  VPCFG_Inventory_blackmetalChestRows: "6", // usually 4
  VPCFG_Inventory_blackmetalChestColumns: "8", // usually 8
  VPCFG_Inventory_personalChestRows: "3", // usually 2
  VPCFG_Inventory_personalChestColumns: "4", // usually 3

  VPCFG_Items_enabled: "true",
  VPCFG_Items_noTeleportPrevention: "true",
  VPCFG_Items_baseItemWeightReduction: "-99", // 1% of original weight
  VPCFG_Items_itemStackMultiplier: "1900", // 20x stack sizes of items
  VPCFG_Items_itemsFloatInWater: "true", // everything floats in water

  VPCFG_Kiln_enabled: "true",
  VPCFG_Kiln_maximumWood: "200", // usually 25
  VPCFG_Kiln_autoFuel: "true",
  VPCFG_Kiln_autoRange: "3",
  VPCFG_Kiln_productionSpeed: "1", // usually 15
  VPCFG_Kiln_dontProcessFineWood: "true",
  VPCFG_Kiln_dontProcessRoundLog: "true",
  VPCFG_Kiln_autoDeposit: "true",

  VPCFG_LootDrop_enabled: "true",
  VPCFG_LootDrop_lootDropAmountMultiplier: "400", // 5x drop amounts
  VPCFG_LootDrop_lootDropChanceMultiplier: "999900", // guarantees all drops

  VPCFG_Map_enabled: "true",
  VPCFG_Map_exploreRadius: "2000", // ususally 100
  VPCFG_Map_preventPlayerFromTurningOffPublicPosition: "true",
  VPCFG_Map_shareMapProgression: "true", // share map among players
  VPCFG_Map_shareAllPins: "true", // share pins among players
  VPCFG_Map_showCartsAndBoats: "true", // carts and boats on map

  VPCFG_Player_enabled: "true",
  VPCFG_Player_baseMaximumWeight: "420", // usually 300
  VPCFG_Player_baseMegingjordBuff: "69000", // nice
  VPCFG_Player_baseAutoPickUpRange: "10", // 5x auto pickup range
  VPCFG_Player_cropNotifier: "true", // crops can't be placed too close to each other where they won't grow
  VPCFG_Player_restSecondsPerComfortLevel: "600", // 10x rested duration
  VPCFG_Player_deathPenaltyMultiplier: "-100", // No penalty
  VPCFG_Player_autoRepair: "true", // repair relevant items immediately upon interacting with the proper bench
  VPCFG_Player_autoUnequipShield: "true", // equip best shield when putting away one handed weapon
  VPCFG_Player_autoEquipShield: "true", // equip best shield when switching to one handed weapon
  VPCFG_Player_reequipItemsAfterSwimming: "true",
  VPCFG_Player_guardianBuffDuration: "2000", // buffs always up
  VPCFG_Player_guardianBuffCooldown: "1",
  VPCFG_Player_iHaveArrivedOnSpawn: "false",
  VPCFG_Player_dontUnequipItemsWhenSwimming: "true",
  VPCFG_Player_fallDamageScalePercent: "-80", // less fall damage
  VPCFG_Player_disableEightSecondTeleport: "true", // teleport quicker

  VPCFG_Smelter_enabled: "true",
  VPCFG_Smelter_maximumOre: "100", // usually 10
  VPCFG_Smelter_maximumCoal: "100", // usually 20
  VPCFG_Smelter_productionSpeed: "1", // usually 30 seconds
  VPCFG_Smelter_autoDeposit: "true", // place result in nearby chest
  VPCFG_Smelter_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_Smelter_autoRange: "3",
  VPCFG_Smelter_coalUsedPerProduct: "1",

  VPCFG_SpinningWheel_enabled: "true",
  VPCFG_SpinningWheel_maximumFlax: "100", // usually 10
  VPCFG_SpinningWheel_productionSpeed: "1", // usually 30
  VPCFG_SpinningWheel_autoDeposit: "true", // place result in nearby chest
  VPCFG_SpinningWheel_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_SpinningWheel_autoRange: "3",

  VPCFG_Stamina_enabled: "true",
  VPCFG_Stamina_sneakStaminaDrain: "-90",
  VPCFG_Stamina_runStaminaDrain: "-90",
  VPCFG_Stamina_jumpStaminaDrain: "-50",
  VPCFG_Stamina_swimStaminaDrain: "-90",
  VPCFG_Stamina_staminaRegen: "50",

  VPCFG_StaminaUsage_enabled: "true", // make tools use way less stamina
  VPCFG_StaminaUsage_hoe: "-95", // 95% less stamina usage
  VPCFG_StaminaUsage_cultivator: "-95",
  VPCFG_StaminaUsage_hammer: "-95",

  VPCFG_StructuralIntegrity_enabled: "true",
  VPCFG_StructuralIntegrity_disableWaterDamageToPlayerBoats: "true", // disable water force damage to boats
  VPCFG_StructuralIntegrity_disableDamageToPlayerBoats: "true", // invincible boats
  VPCFG_StructuralIntegrity_disableDamageToPlayerStructures: "true", // invincible buildings
  VPCFG_StructuralIntegrity_disableDamageToPlayerCarts: "true", // invincible carts
  VPCFG_StructuralIntegrity_disableWaterDamageToPlayerCarts: "true", // invincible carts
  VPCFG_StructuralIntegrity_wood: "2000", // 20x integrity
  VPCFG_StructuralIntegrity_stone: "2000", // 20x integrity
  VPCFG_StructuralIntegrity_iron: "2000", // 20x integrity
  VPCFG_StructuralIntegrity_hardwood: "2000", // 20x integrity
  VPCFG_StructuralIntegrity_marble: "2000", // 20x integrity

  VPCFG_Tameable_enabled: "true",
  VPCFG_Tameable_mortality: "1",
  VPCFG_Tameable_ownerDamageOverride: "true",
  VPCFG_Tameable_stunRecoveryTime: "30",
  VPCFG_Tameable_stunInformation: "true",

  VPCFG_Wagon_enabled: "true",
  VPCFG_Wagon_wagonBaseMass: "1", // wagon is light
  VPCFG_Wagon_wagonExtraMassFromItems: "-99", // item weight in wagon doesn't weigh down at all

  VPCFG_Windmill_enabled: "true",
  VPCFG_Windmill_maximumBarley: "100", // usually 10
  VPCFG_Windmill_productionSpeed: "1", // usually 30
  VPCFG_Windmill_autoDeposit: "true", // place result in nearby chest
  VPCFG_Windmill_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_Windmill_autoRange: "3",

  VPCFG_Workbench_enabled: "true",
  VPCFG_Workbench_disableRoofCheck: "true", // 5x radius
  VPCFG_Workbench_workbenchRange: "100", // 5x radius
  VPCFG_Workbench_workbenchAttachmentRange: "20", // 4x radius

  VPCFG_Durability_enabled: "true", // 20x all durability
  ...["pickaxes", "axes", "hammer", "cultivator", "hoe", "weapons", "armor", "bows", "shields", "torch"]
    .map((it) => ({ [`VPCFG_Durability_${it}`]: "1900" }))
    .reduce((prev, curr) => Object.assign(prev, curr)),

  VPCFG_Experience_enabled: "true", // 100x all experience
  ...[
    "swords",
    "knives",
    "clubs",
    "polearms",
    "spears",
    "blocking",
    "axes",
    "bows",
    "fireMagic",
    "frostMagic",
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
  ]
    .map((it) => ({ [`VPCFG_Experience_${it}`]: "9900" }))
    .reduce((prev, curr) => Object.assign(prev, curr)),

  ...[
    // 5x all drop amounts
    "wood",
    "stone",
    "fineWood",
    "coreWood",
    "elderBark",
    "ironScrap",
    "tinOre",
    "copperOre",
    "silverOre",
    "chitin",
    "feather",
  ]
    .map((it) => ({ [`VPCFG_Gathering_${it}`]: "400" }))
    .reduce((prev, curr) => Object.assign(prev, curr)),

  VPCFG_Pickable_enabled: "true", // 5x all drop amounts
  ...["edibles", "flowersAndIngredients", "materials", "valuables", "surtlingCores"]
    .map((it) => ({ [`VPCFG_Pickable_${it}`]: "400" }))
    .reduce((prev, curr) => Object.assign(prev, curr)),
};
