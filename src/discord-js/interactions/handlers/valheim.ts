import { ActionRowBuilder, SelectMenuOptionBuilder } from "@discordjs/builders";
import { InteractionResponseType, SelectMenuBuilder } from "discord.js";
import { successResponse } from "../responses";
import { getServerConfig } from "../util";

export const SERVER_NAME_SELECT_ID = "server-name";

export const valheimHandler = async () => {
  const serverConfigs = getServerConfig();

  return successResponse({
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      components: [
        new ActionRowBuilder<SelectMenuBuilder>()
          .addComponents(
            new SelectMenuBuilder()
              .setCustomId(SERVER_NAME_SELECT_ID)
              .setOptions(serverConfigs.map(({ name }) => new SelectMenuOptionBuilder().setValue(name).setLabel(name)))
              .setPlaceholder("Select a server...")
          )
          .toJSON(),
      ],
    },
  });
};
