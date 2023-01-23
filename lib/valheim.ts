#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import { DiscordJsInteractionsStack } from "./discord-js-interactions-stack";
import { ValheimSecretStack } from "./secret-stack";
import VALHEIM_PLUS_ENV from "./valheim-plus-config";
import VALHEIM_PLUS_EZPZ_ENV from "./valheim-plus-config-ezpz";
import VALHEIM_PLUS_OMEGA_QOL_ENV from "./valheim-plus-config-omega-qol";
import { ValheimWorldStack } from "./valheim-world-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: "418390728672",
  region: "us-west-2",
};

enum Color {
  NONE = 0x000000,
  GREEN = 0x00ff00,
  YELLOW = 0xffff00,
  ORANGE = 0xff9900,
  RED = 0xff0000,
}

const secretStack = new ValheimSecretStack(app, "ValheimSecretStack", {
  valheimWebhookSecretId: "ValheimWebhooks",
});
const webhookSecrets = secretStack.valheimWebhookSecret;

const PROD_WEBHOOK = webhookSecrets.secretValueFromJson("prod").toString();
const DEBUG_WEBHOOK = webhookSecrets.secretValueFromJson("debug").toString();
const DEBUG_CHANNEL_FAKE_PROD_WEBHOOK = webhookSecrets.secretValueFromJson("dev").toString();

const contentBody = (name: string, content: string, color: Color) =>
  JSON.stringify(
    JSON.stringify({
      embeds: [
        {
          color,
          title: `Server: \\\`${name}\\\``,
          description: content,
        },
      ],
    })
  ).replaceAll("\\\\\\`", "`");

const callNotifyContentWebhook = (name: string, content: string, color: Color = Color.NONE) =>
  `curl -sfSL -X POST -H 'Content-Type: application/json' -d ${contentBody(name, content, color)} "$NOFIFY_WEBHOOK"`;

const callDebugContentWebhook = (name: string, content: string, color: Color = Color.NONE) =>
  `curl -sfSL -X POST -H 'Content-Type: application/json' -d ${contentBody(name, content, color)} "$DEBUG_WEBHOOK"`;

const commonEnv = (name: string) => ({
  VALHEIM_PLUS: "true",
  NOFIFY_WEBHOOK: PROD_WEBHOOK,
  DEBUG_WEBHOOK: DEBUG_WEBHOOK,
  PRE_SUPERVISOR_HOOK: callDebugContentWebhook(name, "Booting up!", Color.YELLOW),
  PRE_BOOTSTRAP_HOOK: callDebugContentWebhook(name, "Bootstrapping..."),
  POST_BOOTSTRAP_HOOK: callDebugContentWebhook(name, "Bootstrapped!"),
  PRE_UPDATE_CHECK_HOOK: callDebugContentWebhook(name, "Updating..."),
  POST_UPDATE_CHECK_HOOK: callDebugContentWebhook(name, "Updated!"),
  PRE_START_HOOK: callDebugContentWebhook(name, "Starting Valheim..."),
  // todo also trigger a status message somehow?
  POST_SERVER_LISTENING_HOOK: callNotifyContentWebhook(name, "Ready to join!", Color.GREEN),
  POST_START_HOOK: callDebugContentWebhook(name, "Started Valheim!"),
  PRE_SERVER_SHUTDOWN_HOOK: callNotifyContentWebhook(name, "Shutting down!", Color.RED),
  POST_SERVER_SHUTDOWN_HOOK: callDebugContentWebhook(name, "Stopped Valheim!"),
});

const hellheimValheimServerStack = new ValheimWorldStack(app, "HellheimWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("hellheim"),
    SERVER_NAME: "Hellheim Dedicated Server",
    WORLD_NAME: "Hellheim",
  },
});

const grantapherValheimServerStack = new ValheimWorldStack(app, "GrantapherWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("grantapher"),
    SERVER_NAME: "Grantapher's Server",
    WORLD_NAME: "GrantapherThanes",
  },
});

const goblinoValheimServerStack = new ValheimWorldStack(app, "GoblinoWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("goblino"),
    SERVER_NAME: "No Goblin Smorc",
    WORLD_NAME: "NoGoblin",
  },
});

const endgardServerStack = new ValheimWorldStack(app, "EndgardWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("endgard"),
    SERVER_NAME: "Endgard",
    WORLD_NAME: "Endgard",
    ...VALHEIM_PLUS_ENV,
  },
});

const arvendServerStack = new ValheimWorldStack(app, "ArvendWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("arvend"),
    SERVER_NAME: "Arvend",
    WORLD_NAME: "Arvend",
    ...VALHEIM_PLUS_EZPZ_ENV,
  },
});

const testEmptyServerStack = new ValheimWorldStack(app, "TestEmptyWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("test"),
    NOFIFY_WEBHOOK: DEBUG_CHANNEL_FAKE_PROD_WEBHOOK,
    SERVER_NAME: "GrantTest",
    WORLD_NAME: "GrantTest",
    ...VALHEIM_PLUS_OMEGA_QOL_ENV,
  },
});

const niflheimServerStack = new ValheimWorldStack(app, "NiflheimWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("niflheim"),
    SERVER_NAME: "NiflheimWorld",
    WORLD_NAME: "NiflheimWorld",
    ...VALHEIM_PLUS_OMEGA_QOL_ENV,
  },
});

new DiscordJsInteractionsStack(app, "DiscordJsInteractionsStack", {
  env,
  clientIdSecretId: "discordValheimBotClientPublicKey",
  botTokenId: "ValheimBotToken",
  servers: {
    niflheim: niflheimServerStack.world,
    hellheim: hellheimValheimServerStack.world,
    grantapher: grantapherValheimServerStack.world,
    goblino: goblinoValheimServerStack.world,
    endgard: endgardServerStack.world,
    arvend: arvendServerStack.world,
    test: testEmptyServerStack.world,
  },
});
