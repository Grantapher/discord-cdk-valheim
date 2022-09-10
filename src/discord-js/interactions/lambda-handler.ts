import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { verifyKey } from "discord-interactions";
import {
  APIChatInputApplicationCommandGuildInteraction,
  APIMessageComponentButtonInteraction,
  APIMessageComponentInteraction,
  APIMessageComponentSelectMenuInteraction,
  APIPingInteraction,
  InteractionResponseType,
  InteractionType,
} from "discord.js";
import { serverSelectHandler } from "./handlers/server-select";
import { startHandler } from "./handlers/start";
import { statusHandler } from "./handlers/status";
import { stopHandler } from "./handlers/stop";
import { SERVER_NAME_SELECT_ID, valheimHandler } from "./handlers/valheim";
import { errorResponse, response, successResponse } from "./responses";

const applicationCommandHandlerMap: Map<
  string,
  (request: APIChatInputApplicationCommandGuildInteraction) => Promise<APIGatewayProxyResult>
> = new Map([["valheim", valheimHandler]]);

const messageComponentHandlerMap: Map<
  string,
  (request: APIMessageComponentInteraction) => Promise<APIGatewayProxyResult>
> = new Map([
  [SERVER_NAME_SELECT_ID, serverSelectHandler],
  ["start", startHandler],
  ["status", statusHandler],
  ["stop", stopHandler],
]);

const getHeader = (event: APIGatewayProxyEvent, key: string) =>
  Object.entries(event.headers).find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase())?.[1];

export const discordInteractionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const signature = getHeader(event, "X-Signature-Ed25519");
  const timestamp = getHeader(event, "X-Signature-Timestamp");

  if (!signature || !timestamp) {
    console.log(event);
    console.error("Missing headers");
    return response(401, `Missing signature headers`);
  } else if (!process.env.CLIENT_PUBLIC_KEY) {
    console.log(event);
    console.error("Missing public key env var");
    return response(500, `Internal Server Error`);
  } else if (!verifyKey(event.body || "", signature, timestamp, process.env.CLIENT_PUBLIC_KEY)) {
    console.log(event);
    console.error("Key not verified");
    return response(401, `Bad request signature`);
  } else if (!event.body) {
    console.log(event);
    console.error("Found empty body");
    return response(400, `Empty request body`);
  }

  const body = JSON.parse(event.body) as
    | APIPingInteraction
    | APIChatInputApplicationCommandGuildInteraction
    | APIMessageComponentButtonInteraction
    | APIMessageComponentSelectMenuInteraction;

  console.log(event.body);

  const type = body.type; // required for the default case

  try {
    switch (body.type) {
      case InteractionType.Ping: {
        console.log("Received ping, returning pong");
        return successResponse({ type: InteractionResponseType.Pong });
      }
      case InteractionType.ApplicationCommand: {
        const request = body as APIChatInputApplicationCommandGuildInteraction;
        const handler =
          applicationCommandHandlerMap.get(request.data.name) ??
          (() => errorResponse(`No handler for Command ${request.data.name}`));
        return await handler(request);
      }
      case InteractionType.MessageComponent: {
        const request = body as APIMessageComponentInteraction;
        const handler =
          messageComponentHandlerMap.get(request.data.custom_id) ??
          (() => errorResponse(`No handler for MessageComponent ${request.data.custom_id}`));
        return await handler(request);
      }
      default: {
        return errorResponse(`Unexpected InteractionType ${type}`);
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};
