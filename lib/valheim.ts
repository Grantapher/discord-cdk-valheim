#!/usr/bin/env node
import { DiscordJsInteractionsStack } from "./discord-js-interactions-stack";
import { ValheimSecretStack } from "./secret-stack";
import VALHEIM_PLUS_OMEGA_QOL_ENV from "./valheim-plus-config-omega-qol";
import VALHEIM_PLUS_OMEGA_QOL_ENV_PRE_ASH from "./valheim-plus-config-omega-qol-pre-ashlands";
import { ValheimS3Stack } from "./valheim-s3-stack";
import { ValheimWorldStack } from "./valheim-world-stack";
import { ValheimWorld } from "cdk-valheim";
import * as cdk from "aws-cdk-lib";

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

const installAwsCli = "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install awscli";
const downloadCustomVPlus =
  "aws s3 cp s3://valheim-cdk-bucket/mods/dll/ValheimPlus.dll /opt/valheim/plus/BepInEx/plugins/ValheimPlus.dll";

const commonEnv = (name: string) => ({
  VALHEIM_PLUS: "true",
  VALHEIM_PLUS_REPO: "Grantapher/ValheimPlus",
  // VALHEIM_PLUS_RELEASE: "tags/0.9.9.15-alpha7",
  // STEAMCMD_ARGS: "-beta public-test -betapassword yesimadebackups",
  SERVER_ARGS: "-crossplay",
  NOFIFY_WEBHOOK: PROD_WEBHOOK,
  DEBUG_WEBHOOK: DEBUG_WEBHOOK,
  PRE_SUPERVISOR_HOOK: callDebugContentWebhook(name, "Booting up!", Color.YELLOW),
  PRE_BOOTSTRAP_HOOK: callDebugContentWebhook(name, "Bootstrapping..."),
  POST_BOOTSTRAP_HOOK: `${installAwsCli} && ${callDebugContentWebhook(name, "Bootstrapped!")} `,
  PRE_UPDATE_CHECK_HOOK: callDebugContentWebhook(name, "Updating..."),
  POST_UPDATE_CHECK_HOOK: callDebugContentWebhook(name, "Updated!"),
  PRE_START_HOOK: callDebugContentWebhook(name, "Starting Valheim..."),
  // todo also trigger a status message somehow?
  POST_SERVER_LISTENING_HOOK: callNotifyContentWebhook(name, "Ready to join!", Color.GREEN),
  POST_START_HOOK: callDebugContentWebhook(name, "Started Valheim!"),
  PRE_SERVER_SHUTDOWN_HOOK: callNotifyContentWebhook(name, "Shutting down!", Color.RED),
  POST_SERVER_SHUTDOWN_HOOK: callDebugContentWebhook(name, "Stopped Valheim!"),
});

const s3Stack = new ValheimS3Stack(app, "ValheimS3Stack", {
  env,
  bucketName: "valheim-cdk-bucket",
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
    //POST_UPDATE_CHECK_HOOK: `${callDebugContentWebhook("test", "Updated!")} && ${downloadCustomVPlus}`,
  },
});

const betaServerStack = new ValheimWorldStack(app, "BetaWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("beta"),
    NOFIFY_WEBHOOK: DEBUG_CHANNEL_FAKE_PROD_WEBHOOK,
    SERVER_NAME: "BetaWorld",
    WORLD_NAME: "BetaWorld",
    ...VALHEIM_PLUS_OMEGA_QOL_ENV,
    POST_UPDATE_CHECK_HOOK: `${callDebugContentWebhook("test", "Updated!")} && ${downloadCustomVPlus}`,
  },
});

const ashinoWorld = new ValheimWorldStack(app, "AshinoWorld", {
  env,
  passwordSecretId: "valheimServerPass",
  adminlistSecretId: "adminlistValheim",
  environment: {
    ...commonEnv("ashino"),
    SERVER_NAME: "Ashino",
    WORLD_NAME: "Ashino",
    ...VALHEIM_PLUS_OMEGA_QOL_ENV_PRE_ASH,
  },
});

const allServers: Record<string, ValheimWorld> = {
  beta: betaServerStack.world,
  test: testEmptyServerStack.world,
  ashino: ashinoWorld.world,
};

new DiscordJsInteractionsStack(app, "DiscordJsInteractionsStack", {
  env,
  clientIdSecretId: "discordValheimBotClientPublicKey",
  botTokenId: "ValheimBotToken",
  servers: allServers,
});

Object.values(allServers).forEach((valheimWorld) =>
  s3Stack.bucket.grantRead(valheimWorld.service.taskDefinition.taskRole)
);
