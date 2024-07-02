import { REST } from "@discordjs/rest";
import { Routes, SlashCommandBuilder } from "discord.js";
import config from "../../config";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

// const beepCommand = new SlashCommandBuilder().setName("beep").setDescription("Replies with boop!");

const valheimCommand = new SlashCommandBuilder()
  .setName("valheim")
  .setDescription("Interact with the Valheim servers.");

const vsfnCommand = new SlashCommandBuilder()
  .setName("vsfn")
  .setDescription("Interact with the Valheim servers (sfn).");

export const deployCommands = async () => {
  const { applicationId, guildId } = config;

  const secretsClient = new SecretsManager({});
  const secret = await secretsClient.getSecretValue({ SecretId: "ValheimBotToken" });
  const secretStr = secret.SecretString ?? "";
  if (secretStr === "") {
    console.error("Secret doesn't exist.");
    return;
  }

  const secretJson = JSON.parse(secretStr);
  const token = secretJson.TOKEN;

  const rest = new REST({ version: "10" }).setToken(token);

  const commands = [valheimCommand, vsfnCommand].map((command) => command.toJSON());
  console.log("Setting commands:");
  console.log(JSON.stringify(commands, null, 2));

  try {
    console.log("Started refreshing application (/) commands.");
    await rest.put(Routes.applicationGuildCommands(applicationId, guildId), { body: commands });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
    throw error;
  }
};
