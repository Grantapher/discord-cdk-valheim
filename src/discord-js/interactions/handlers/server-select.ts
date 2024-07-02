import {
  APIMessageComponentInteraction,
  APIMessageComponentSelectMenuInteraction,
  InteractionResponseType,
  StringSelectMenuBuilder,
} from "discord.js";
import { getServerConfig } from "../util";
import { successResponse } from "../responses";
import { ActionRowBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { SERVER_NAME_SELECT_ID } from "./valheim";
import { SFN } from "@aws-sdk/client-sfn";

const sfnClient = new SFN({});

export const serverSelectHandler = async (interaction: APIMessageComponentInteraction) => {
  const request = interaction as APIMessageComponentSelectMenuInteraction;
  const selected = request.data.values[0]; // multi-select is not allowed

  const serverConfigs = getServerConfig();
  const serverConfig = serverConfigs.find((config) => config.name === selected);
  if (!serverConfig) throw new Error(`Server config not found for ${selected}!`);

  await sfnClient.startExecution({
    stateMachineArn: serverConfig.statusSfnArn,
    input: JSON.stringify({
      id: interaction.id,
      token: interaction.token,
    }),
  });

  return successResponse({
    type: InteractionResponseType.UpdateMessage,
    data: {
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(SERVER_NAME_SELECT_ID)
              .setOptions(
                serverConfigs.map(({ name }) =>
                  new StringSelectMenuOptionBuilder()
                    .setValue(name)
                    .setLabel(name)
                    .setDefault(name === selected)
                )
              )
              .setPlaceholder("Select a server...")
          )
          .toJSON(),
      ],
    },
  });
};
