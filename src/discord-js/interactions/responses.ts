import { ActionRowBuilder } from "@discordjs/builders";
import { APIGatewayProxyResult } from "aws-lambda";
import {
  APIActionRowComponent,
  APIEmbed,
  APIInteractionResponse,
  APIMessageActionRowComponent,
  EmbedBuilder,
  InteractionResponseType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { SERVER_NAME_SELECT_ID } from "./handlers/valheim";
import { getServerConfig } from "./util";

export const response: (statusCode: number, body: string) => APIGatewayProxyResult = (
  statusCode: number,
  body: string
) => {
  console.log(body);
  return { statusCode, body };
};

export const successResponse: (resp: APIInteractionResponse) => APIGatewayProxyResult = (
  body: APIInteractionResponse
) => response(200, JSON.stringify(body));

export const errorResponse: (errorMessage: string) => APIGatewayProxyResult = (errorMessage: string) =>
  response(503, JSON.stringify({ content: errorMessage }));

export const serverResponse: (
  selectedServerName: string,
  color: number,
  extraActionRows?: APIActionRowComponent<APIMessageActionRowComponent>[],
  extraEmbeds?: APIEmbed[]
) => APIInteractionResponse = (
  selectedServerName: string,
  color: number,
  extraActionRows: APIActionRowComponent<APIMessageActionRowComponent>[] = [],
  extraEmbeds: APIEmbed[] = []
) => {
  const serverConfigs = getServerConfig();
  return {
    type: InteractionResponseType.UpdateMessage,
    data: {
      embeds: [
        new EmbedBuilder().setColor(color).setTitle(`Server: \`${selectedServerName}\``).toJSON(),
        ...extraEmbeds,
      ],
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
                    .setDefault(name === selectedServerName)
                )
              )
              .setPlaceholder("Select a server...")
          )
          .toJSON(),
        ...extraActionRows,
      ],
    },
  };
};
