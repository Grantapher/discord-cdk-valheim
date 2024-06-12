export default {
  // Valheim plus options as env config...
  VPCFG_Server_enabled: "true", // enable V+, server syncing of configs, and enforcing v+ installations

  VPCFG_Bed_enabled: "true", // enable ability to sleep on bed without claiming spawn

  VPCFG_Beehive_enabled: "true",
  VPCFG_Beehive_showDuration: "true", // show mins/secs to next honey
  VPCFG_Beehive_honeyProductionSpeed: "600", // usually 1200
  VPCFG_Beehive_autoDeposit: "true",
  VPCFG_Beehive_autoDepositRange: "5",

  VPCFG_Building_enabled: "true",
  VPCFG_Building_noWeatherDamage: "true", // rain doesn't decay
  VPCFG_Building_maximumPlacementDistance: "15", // place things 3x further away
  VPCFG_Building_pieceComfortRadius: "20", // 2x distance for comfort affecting furnature
  VPCFG_Building_alwaysDropResources: "true", // always refund the refundable resources on manual destruction
  VPCFG_Building_enableAreaRepair: "true", // repair with hammer works on a radius

  VPCFG_Camera_enabled: "true",
  VPCFG_Camera_cameraBoatMaximumZoomDistance: "30", // 5x zoom out on boats

  VPCFG_CraftFromChest_enabled: "true", // craft from chests/carts/ships around your nearest workbench
  VPCFG_CraftFromChest_range: "30", // default 20

  VPCFG_Experience_enabled: "true", // 5x all experience
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
    "jump",
    "sneak",
    "run",
    "swim",
    "ride",
  ]
    .map((it) => ({ [`VPCFG_Experience_${it}`]: "400" }))
    .reduce((prev, curr) => Object.assign(prev, curr)),

  VPCFG_Fermenter_enabled: "true",
  VPCFG_Fermenter_showDuration: "true", // show mins/secs to finishing
  VPCFG_Fermenter_autoFuel: "true", // looks in nearby chest for mead
  VPCFG_Fermenter_autoDeposit: "true",
  VPCFG_Fermenter_autoRange: "3",
  VPCFG_Fermenter_torches: "true", // torches stay at max once filled

  VPCFG_FireSource_enabled: "true",
  VPCFG_FireSource_autoFuel: "true", // looks in nearby chest for wood
  VPCFG_FireSource_autoRange: "3",

  VPCFG_Food_enabled: "true",
  VPCFG_Food_disableFoodDegradation: "true",

  VPCFG_Furnace_enabled: "true",
  VPCFG_Furnace_maximumOre: "25", // usually 10
  VPCFG_Furnace_maximumCoal: "50", // usually 20
  VPCFG_Furnace_productionSpeed: "20", // usually 30
  VPCFG_Furnace_autoDeposit: "true", // place result in nearby chest
  VPCFG_Furnace_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_Furnace_autoRange: "3",

  VPCFG_Game_enabled: "true",
  VPCFG_Game_disableFog: "true",

  VPCFG_GameClock_enabled: "true",
  VPCFG_GameClock_useAMPM: "true",

  VPCFG_HUD_enabled: "true",
  VPCFG_HUD_showRequiredItems: "true", // show amount of items available while crafting
  VPCFG_HUD_displayBowAmmoCounts: "2", // show ammo count
  VPCFG_HUD_experienceGainedNotifications: "true",

  VPCFG_Inventory_enabled: "true",
  VPCFG_Inventory_playerInventoryRows: "5", // usually 4
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
  // VPCFG_Items_noTeleportPrevention: "true", // maybe?
  VPCFG_Items_itemStackMultiplier: "200", // 3x stack sizes of items
  VPCFG_Items_itemsFloatInWater: "true", // everything floats in water

  VPCFG_Kiln_enabled: "true",
  VPCFG_Kiln_maximumWood: "50", // usually 25
  VPCFG_Kiln_autoFuel: "true",
  VPCFG_Kiln_autoRange: "3",
  VPCFG_Kiln_dontProcessFineWood: "true",
  VPCFG_Kiln_dontProcessRoundLog: "true",
  VPCFG_Kiln_productionSpeed: "10", // usually 15
  VPCFG_Kiln_autoDeposit: "true",

  VPCFG_Map_enabled: "true",
  VPCFG_Map_preventPlayerFromTurningOffPublicPosition: "true",
  VPCFG_Map_shareMapProgression: "true", // share map among players
  VPCFG_Map_shareAllPins: "true", // share pins among players
  VPCFG_Map_exploreRadius: "150", // usually 100

  VPCFG_Player_enabled: "true",
  VPCFG_Player_baseMegingjordBuff: "300", // belt does 2x weight instead of the 1.5x default
  VPCFG_Player_baseAutoPickUpRange: "5", // 2.5x auto pickup range
  VPCFG_Player_cropNotifier: "true", // crops can't be placed too close to each other where they won't grow
  VPCFG_Player_restSecondsPerComfortLevel: "150", // 2.5x rested duration
  VPCFG_Player_deathPenaltyMultiplier: "-66", // 1/3 the penalty for dying
  VPCFG_Player_autoRepair: "true", // repair relevant items immediately upon interacting with the proper bench
  VPCFG_Player_autoUnequipShield: "true", // equip best shield when putting away one handed weapon
  VPCFG_Player_autoEquipShield: "true", // equip best shield when switching to one handed weapon
  VPCFG_Player_reequipItemsAfterSwimming: "true",
  VPCFG_Player_guardianBuffDuration: "360",
  VPCFG_Player_guardianBuffCooldown: "900",
  VPCFG_Player_iHaveArrivedOnSpawn: "false",
  VPCFG_Player_queueWeaponChanges: "true",

  VPCFG_Smelter_enabled: "true",
  VPCFG_Smelter_maximumOre: "25", // usually 10
  VPCFG_Smelter_maximumCoal: "50", // usually 20
  VPCFG_Smelter_productionSpeed: "20", // usually 30
  VPCFG_Smelter_autoDeposit: "true", // place result in nearby chest
  VPCFG_Smelter_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_Smelter_autoRange: "3",

  VPCFG_SpinningWheel_enabled: "true",
  VPCFG_SpinningWheel_maximumFlax: "50", // usually 10
  VPCFG_SpinningWheel_productionSpeed: "20", // usually 30
  VPCFG_SpinningWheel_autoDeposit: "true", // place result in nearby chest
  VPCFG_SpinningWheel_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_SpinningWheel_autoRange: "3",

  VPCFG_Stamina_enabled: "true",
  VPCFG_Stamina_sneakStaminaDrain: "-75", // 1/4 drain for sneaking

  VPCFG_StaminaUsage_enabled: "true",
  VPCFG_StaminaUsage_hoe: "-99", // spam click it
  VPCFG_StaminaUsage_cultivator: "-99", // spam click it
  VPCFG_StaminaUsage_hammer: "-99", // spam click it

  VPCFG_StructuralIntegrity_enabled: "true",
  VPCFG_StructuralIntegrity_disableWaterDamageToPlayerBoats: "true", // disable water force damage to boats
  VPCFG_StructuralIntegrity_hardWood: "50", // 2x integrity
  VPCFG_StructuralIntegrity_stone: "67", // 3x integrity
  VPCFG_StructuralIntegrity_iron: "67", // 3x integrity

  VPCFG_Wagon_enabled: "true",
  VPCFG_Wagon_wagonExtraMassFromItems: "-66", // item weight in wagon doesn't weigh down as much

  VPCFG_Windmill_enabled: "true",
  VPCFG_Windmill_maximumBarley: "50", // usually 10
  VPCFG_Windmill_productionSpeed: "20", // usually 30
  VPCFG_Windmill_autoDeposit: "true", // place result in nearby chest
  VPCFG_Windmill_autoFuel: "true", // retrieve fuel from nearby chests
  VPCFG_Windmill_autoRange: "3",

  VPCFG_Workbench_enabled: "true",
  VPCFG_Workbench_workbenchRange: "30", // 1.5x radius
  VPCFG_Workbench_workbenchAttachmentRange: "10", // 2x radius
};
