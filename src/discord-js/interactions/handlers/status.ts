import * as ecs from "@aws-sdk/client-ecs";
import { ActionRowBuilder, ButtonBuilder } from "@discordjs/builders";
import {
  APIEmbed,
  APIEmbedField,
  APIMessageComponentButtonInteraction,
  APIMessageComponentInteraction,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import fetch from "node-fetch";
import { errorResponse, serverResponse, successResponse } from "../responses";
import { ec2Client, ecsClient, getServerConfig, getServerNameFromComponents } from "../util";

export const SERVER_NAME_SELECT_ID = "server-name";
const debug = false;

export const statusHandler = async (interaction: APIMessageComponentInteraction) => {
  const request = interaction as APIMessageComponentButtonInteraction;
  const selected = getServerNameFromComponents(request.message.components)?.value;
  return await status(selected);
};

export const status = async (serverName: string | undefined) => {
  if (serverName == null) {
    return errorResponse("Nothing selected!");
  }

  // todo add interaction param once it is a custom resource so that this isn't hardcoded.
  const respond = (startEnabled: boolean, stopEnabled: boolean, embeds: APIEmbed[]) =>
    successResponse(
      serverResponse(
        serverName,
        0xff8800,
        [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("start")
                .setLabel("Start")
                .setStyle(ButtonStyle.Success)
                .setDisabled(!startEnabled),
              new ButtonBuilder().setCustomId("status").setLabel("Status").setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("stop")
                .setLabel("Stop")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(!stopEnabled)
            )
            .toJSON(),
        ],
        embeds
      )
    );

  const successResponseWithError = (message: string) =>
    respond(false, false, [new EmbedBuilder().setColor(0xff0000).setTitle("Error!").setDescription(message).toJSON()]);

  const config = getServerConfig().find((config) => config.name === serverName);
  if (!config) {
    return successResponseWithError(`Couldn't find server: \`${serverName}\`.`);
  }

  const { arn, service } = config;
  const describeServicesResponse = await ecsClient.describeServices({
    cluster: arn,
    services: [service],
  });

  const ecsService = describeServicesResponse?.services?.find(() => true); // first or undef

  if (!ecsService) {
    return successResponseWithError(`Couldn't find the configured service.`);
  }

  const enabled = (ecsService.desiredCount ?? 0) > 0;

  let debugContent = "";
  if (debug) {
    debugContent =
      `Desired: ${ecsService.desiredCount ? "Yes" : "No"}\n` +
      `Running: ${ecsService.runningCount ? "Yes" : "No"}\n` +
      `Pending: ${ecsService.pendingCount ? "Yes" : "No"}\n`;
  }

  if ((ecsService.runningCount ?? 0) < 1) {
    const [statusString, color] = getStatus(ecsService, false);
    return respond(!enabled, enabled, [
      new EmbedBuilder()
        .setColor(color)
        .setFields(
          [{ name: "Status", value: statusString }, debug && { name: "Debug", value: debugContent }].filter(
            (x): x is APIEmbedField => !!x
          )
        )
        .toJSON(),
    ]);
  }

  const listTasksResp = await ecsClient.listTasks({ cluster: ecsService.clusterArn });
  const taskDefPromise = ecsClient.describeTaskDefinition({ taskDefinition: ecsService.taskDefinition });
  const describeTasksResp = await ecsClient.describeTasks({
    tasks: listTasksResp.taskArns,
    cluster: ecsService.clusterArn,
  });
  const eniId = describeTasksResp.tasks
    ?.find(() => true)
    ?.attachments?.find(() => true)
    ?.details?.find((pair) => pair.name === "networkInterfaceId")?.value;
  const niDescription = eniId
    ? await ec2Client.describeNetworkInterfaces({
        NetworkInterfaceIds: [eniId],
      })
    : undefined;
  const taskDef = await taskDefPromise;

  const valheimEnv = taskDef?.taskDefinition?.containerDefinitions?.find(() => true)?.environment;
  const pass = valheimEnv?.find((pair) => pair.name === "SERVER_PASS")?.value;
  const port = valheimEnv?.find((pair) => pair.name === "SERVER_PORT")?.value ?? "2456";

  const publicIp = niDescription?.NetworkInterfaces?.find(() => true)?.Association?.PublicIp;

  // todo make a type result for the status.json result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status: any | undefined = await fetch(`http://${publicIp}/status.json`)
    .then((res) => res.json())
    .catch(() => undefined);

  const serverUp = typeof status?.player_count == "number";

  // todo add player names? status.json doesn't seem to have them correctly

  if (debug) {
    debugContent += `serverUp: ${serverUp ? "Yes" : "No"}\n`;
  }

  const [statusString, color] = getStatus(ecsService, serverUp);

  return respond(
    !enabled,
    enabled,
    [
      new EmbedBuilder()
        .setColor(color)
        .setFields(
          [
            { name: "Status", value: statusString },
            serverUp && {
              name: "Player Count",
              value: `${status.player_count}`,
              inline: true,
            },
            serverUp && { name: "IP Address", value: `\`${publicIp}\``, inline: true },
            serverUp && pass && { name: "Password", value: `\`${pass}\``, inline: true },
            debug && { name: "Debug", value: debugContent },
          ].filter((x): x is APIEmbedField => !!x)
        )
        .toJSON(),
      statusString === "Online" &&
        new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("One-Click Join")
          .setDescription(
            `Game must not be already open.\nsteam://run/892970//-console%20%2Bconnect%20${publicIp}%3A${port}%20%2Bpassword%20${pass}\n`
          )
          .toJSON(),
    ].filter((x): x is APIEmbed => !!x)
  );
};

const getStatus: (service: ecs.Service, online: boolean) => [string, number] = (
  service: ecs.Service,
  online: boolean
) => {
  switch (`${online ? 1 : 0}${service.runningCount}${service.desiredCount}${service.pendingCount}`) {
    case "0000":
      return ["Shut Down", 0xff0000];
    case "0010":
      return ["Startup Request Accepted", 0xff8800];
    case "0011":
      return ["Provisioning", 0xff8800];
    case "0100":
      return ["Shutting Down", 0xff0000];
    case "0110":
      return ["Starting Game", 0xff8800];
    case "1100":
      return ["Quitting Game", 0xff0000];
    case "1110":
      return ["Online", 0x00ff00];
    default:
      return ["Unknown", 0xff0000];
  }
};
