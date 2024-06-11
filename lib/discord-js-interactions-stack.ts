import * as cdk from "aws-cdk-lib";
import {
  aws_apigateway as apig,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_route53 as r53,
  aws_secretsmanager as sm,
  Duration,
} from "aws-cdk-lib";
import { ValheimWorld } from "cdk-valheim";

export interface ServerProps {
  readonly world: ValheimWorld;
  readonly urlPrefix: string;
}

export interface DiscordJsInteractionsStackProps extends cdk.StackProps {
  readonly servers: { [name: string]: ServerProps };
  readonly clientIdSecretId: string;
  readonly botTokenId: string;
  readonly hostedZone: r53.IHostedZone;
}

export class DiscordJsInteractionsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DiscordJsInteractionsStackProps) {
    super(scope, id, props);

    const { servers, clientIdSecretId, hostedZone } = props;

    const clientPublicKeySecret = sm.Secret.fromSecretNameV2(this, "ClientPubKey", clientIdSecretId);
    // const botToken = sm.Secret.fromSecretNameV2(this, "BotToken", props.botTokenId);

    const serverConfigs = Object.entries(servers).map(([name, server]) => ({
      name,
      service: server.world.service.serviceName,
      arn: server.world.service.cluster.clusterArn,
      urlPrefix: server.urlPrefix,
    }));

    const lambdaFunction = new lambda.Function(this, "Function", {
      code: new lambda.AssetCode("src/dist"),
      handler: "discord-js.discordInteractionsHandler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      environment: {
        CLIENT_PUBLIC_KEY: clientPublicKeySecret.secretValueFromJson("CLIENT_PUBLIC_KEY").toString(),
        // BOT_TOKEN: botToken.secretValueFromJson("TOKEN").toString(),
        SERVER_CONFIG: JSON.stringify(serverConfigs),
        HOSTED_ZONE_ID: hostedZone.hostedZoneId,
        HOSTED_ZONE_NAME: hostedZone.zoneName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // todo be more specific
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    lambdaFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"));
    lambdaFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonRoute53FullAccess"));

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
