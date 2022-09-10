import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import {
  APIEmbed,
  APIMessageComponentButtonInteraction,
  APIMessageComponentInteraction,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { errorResponse, serverResponse, successResponse } from "../responses";
import { ecsClient, getServerConfig, getServerNameFromComponents } from "../util";

export const startHandler = async (interaction: APIMessageComponentInteraction) => {
  const request = interaction as APIMessageComponentButtonInteraction;
  const selected = getServerNameFromComponents(request.message.components)?.value;

  if (selected == null) {
    return errorResponse("Nothing selected!");
  }

  const respond = (enabled: boolean, embed: APIEmbed) =>
    successResponse(
      serverResponse(
        selected,
        0xff8800,
        [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("start")
                .setLabel("Start")
                .setStyle(ButtonStyle.Success)
                .setDisabled(enabled),
              new ButtonBuilder().setCustomId("status").setLabel("Status").setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!enabled)
            )
            .toJSON(),
        ],
        [embed]
      )
    );

  const successResponseWithError = (message: string) =>
    respond(false, new EmbedBuilder().setColor(0xff0000).setTitle("Error!").setDescription(message).toJSON());

  const config = getServerConfig().find((config) => config.name === selected);
  if (!config) {
    return successResponseWithError(`Couldn't find server: \`${selected}\`.`);
  }

  const success = await ecsClient.updateService({
    cluster: config.arn,
    service: config.service,
    desiredCount: 1,
  });

  if (!success) {
    return successResponseWithError("Issue communicating with AWS");
  }

  return respond(
    true,
    new EmbedBuilder().setColor(0x00ff00).setTitle("Success!").setDescription("Set status to **on**.").toJSON()
  );
};
