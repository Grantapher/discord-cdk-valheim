import {
  APIActionRowComponent,
  APIMessageActionRowComponent,
  APISelectMenuComponent,
  ComponentType,
  REST,
} from "discord.js";
import config from "../../config";
import { SERVER_NAME_SELECT_ID } from "./handlers/valheim";
import * as ecs from "@aws-sdk/client-ecs";
import * as ec2 from "@aws-sdk/client-ec2";

export const getServerConfig = () => {
  const serverConfigString = process.env.SERVER_CONFIG;

  if (!serverConfigString) {
    console.log("No servers configured!");
  }

  const serverConfigs = JSON.parse(serverConfigString ?? "[]") as ServerConfig[];
  console.log(`Server Config: ${JSON.stringify(serverConfigs)}`);
  return serverConfigs;
};

export interface ServerConfig {
  readonly name: string;
  readonly service: string;
  readonly arn: string;
}

const { token } = config;
export const rest = new REST({ version: "10" }).setToken(token);

export const ecsClient = new ecs.ECS({});
export const ec2Client = new ec2.EC2({});
export const getServerNameFromComponents = (
  rows: APIActionRowComponent<APIMessageActionRowComponent>[] | undefined
) => {
  const selectComponent = rows
    ?.flatMap((row) => row.components)
    ?.find(
      (component) => component.type === ComponentType.SelectMenu && component.custom_id == SERVER_NAME_SELECT_ID
    ) as APISelectMenuComponent | undefined;
  return selectComponent?.options?.find((option) => option.default === true);
};
