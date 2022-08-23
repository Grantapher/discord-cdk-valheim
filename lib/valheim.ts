#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { DiscordInteractionsStack } from "./interactions-stack";
import { ValheimWorldStack } from "./valheim-world-stack";
import VALHEIM_PLUS_ENV from "./valheim-plus-config";

const app = new cdk.App();

const env: cdk.Environment = {
  account: "418390728672",
  region: "us-west-2",
};

const hellheimValheimServerStack = new ValheimWorldStack(app, "HellheimWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    SERVER_NAME: "Hellheim Dedicated Server",
    WORLD_NAME: "Hellheim",
  },
});

const grantapherValheimServerStack = new ValheimWorldStack(app, "GrantapherWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    SERVER_NAME: "Grantapher's Server",
    WORLD_NAME: "GrantapherThanes",
  },
});

const goblinoValheimServerStack = new ValheimWorldStack(app, "GoblinoWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    SERVER_NAME: "No Goblin Smorc",
    WORLD_NAME: "NoGoblin",
  },
});

const endgardServerStack = new ValheimWorldStack(app, "EndgardWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    SERVER_NAME: "Endgard",
    WORLD_NAME: "Endgard",
    ...VALHEIM_PLUS_ENV,
  },
});

const testEmptyServerStack = new ValheimWorldStack(app, "TestEmptyWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    SERVER_NAME: "GrantTest",
    WORLD_NAME: "GrantTest",
  },
});

new DiscordInteractionsStack(app, "DiscordInteractionsStack", {
  env,
  clientIdSecretId: "discordValheimBotClientPublicKey",
  servers: {
    hellheim: hellheimValheimServerStack.world,
    grantapher: grantapherValheimServerStack.world,
    goblino: goblinoValheimServerStack.world,
    endgard: endgardServerStack.world,
    test: testEmptyServerStack.world,
  },
});
