import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import * as apig from "@aws-cdk/aws-apigateway";
import * as logs from "@aws-cdk/aws-logs";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as iam from "@aws-cdk/aws-iam";
import { ValheimWorld } from "cdk-valheim";
import { Duration } from "@aws-cdk/core";

export interface DiscordJsInteractionsStackProps extends cdk.StackProps {
  readonly servers: { [name: string]: ValheimWorld };
  readonly clientIdSecretId: string;
  readonly botTokenId: string;
}

export class DiscordJsInteractionsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DiscordJsInteractionsStackProps) {
    super(scope, id, props);

    const clientPublicKeySecret = sm.Secret.fromSecretNameV2(this, "ClientPubKey", props.clientIdSecretId);
    // const botToken = sm.Secret.fromSecretNameV2(this, "BotToken", props.botTokenId);

    const serverConfigs = Object.entries(props.servers).map(([name, world]) => ({
      name,
      service: world.service.serviceName,
      arn: world.service.cluster.clusterArn,
    }));

    const lambdaFunction = new lambda.Function(this, "Function", {
      code: new lambda.AssetCode("src/dist"),
      handler: "discord-js.discordInteractionsHandler",
      runtime: lambda.Runtime.NODEJS_16_X,
      timeout: Duration.seconds(10),
      environment: {
        CLIENT_PUBLIC_KEY: clientPublicKeySecret.secretValueFromJson("CLIENT_PUBLIC_KEY").toString(),
        // BOT_TOKEN: botToken.secretValueFromJson("TOKEN").toString(),
        SERVER_CONFIG: JSON.stringify(serverConfigs),
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // todo be more specific
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    lambdaFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"));

    const api = new apig.RestApi(this, "DiscordEndpoint");
    api.root.addMethod(
      "POST",
      new apig.LambdaIntegration(lambdaFunction, {
        requestTemplates: {
          "application/json": `{
                "method": "$context.httpMethod",
                "body" : $input.json("$"),
                "headers": {
                    #foreach($param in $input.params().header.keySet())
                    "$param": "$util.escapeJavaScript($input.params().header.get($param))"
                    #if($foreach.hasNext),#end
                    #end
                }
            }`,
        },
      })
    );
  }
}
