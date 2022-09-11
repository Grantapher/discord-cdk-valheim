import { REST } from "@discordjs/rest";
import { Routes, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import config from "../../config";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

// const beepCommand = new SlashCommandBuilder().setName("beep").setDescription("Replies with boop!");

const serverNameStringOption = new SlashCommandStringOption()
  .setName("server-name")
  .setDescription("Name of the server.")
  .setRequired(true);

const vhCommand = new SlashCommandBuilder()
  .setName("vh")
  .setDescription("Interact with the Valheim servers.")
  .addSubcommand(new SlashCommandSubcommandBuilder().setName("list").setDescription("List the available servers."))
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("start")
      .setDescription("Start a Server")
      .addStringOption(serverNameStringOption)
  )
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("status")
      .setDescription("Check the status of a server")
      .addStringOption(serverNameStringOption)
  )
  .addSubcommand(
    new SlashCommandSubcommandBuilder()
      .setName("stop")
      .setDescription("Stop a Server")
      .addStringOption(serverNameStringOption)
  );

const valheimCommand = new SlashCommandBuilder()
  .setName("valheim")
  .setDescription("Interact with the Valheim servers.");

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

  const commands = [vhCommand, valheimCommand].map((command) => command.toJSON());
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
