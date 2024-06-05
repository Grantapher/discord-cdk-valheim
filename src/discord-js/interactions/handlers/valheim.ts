import { ActionRowBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { InteractionResponseType, StringSelectMenuBuilder } from "discord.js";
import { successResponse } from "../responses";
import { getServerConfig } from "../util";

export const SERVER_NAME_SELECT_ID = "server-name";

export const valheimHandler = async () => {
  const serverConfigs = getServerConfig();

  return successResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      components: [
        new ActionRowBuilder<StringSelectMenuBuilder>()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(SERVER_NAME_SELECT_ID)
              .setOptions(
                serverConfigs.map(({ name }) => new StringSelectMenuOptionBuilder().setValue(name).setLabel(name))
              )
              .setPlaceholder("Select a server...")
          )
          .toJSON(),
      ],
    },
  });
};
