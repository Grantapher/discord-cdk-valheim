import { APIActionRowComponent, APIMessageActionRowComponent, ComponentType } from "discord.js";
import { SERVER_NAME_SELECT_ID } from "./handlers/valheim";
import * as ecs from "@aws-sdk/client-ecs";
import * as ec2 from "@aws-sdk/client-ec2";
import * as r53 from "@aws-sdk/client-route-53";

export const getServerConfig = () => {
  const serverConfigString = process.env.SERVER_CONFIG;

  if (!serverConfigString) {
    console.log("No servers configured!");
  }

  const serverConfigs = JSON.parse(serverConfigString ?? "[]") as ServerConfig[];
  console.log(`Server Config: ${JSON.stringify(serverConfigs)}`);
  return serverConfigs;
};

export const getHostedZoneId = () => process.env.HOSTED_ZONE_ID;
export const getHostedZoneName = () => process.env.HOSTED_ZONE_NAME;

export interface ServerConfig {
  readonly name: string;
  readonly service: string;
  readonly arn: string;
  readonly urlPrefix: string;
}

export const ecsClient = new ecs.ECS({});
export const ec2Client = new ec2.EC2({});
export const r53Client = new r53.Route53({});
export const getServerNameFromComponents = (
  rows: APIActionRowComponent<APIMessageActionRowComponent>[] | undefined
) => {
  const selectComponent = rows
    ?.flatMap((row) => row.components)
    ?.map((component) =>
      component.type === ComponentType.StringSelect && component.custom_id == SERVER_NAME_SELECT_ID
        ? component
        : undefined
    )
    ?.find((stringSelect) => stringSelect != undefined);
  return selectComponent?.options?.find((option) => option.default === true);
};
