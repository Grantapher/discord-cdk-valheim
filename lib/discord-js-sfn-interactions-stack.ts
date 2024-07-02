import * as cdk from "aws-cdk-lib";
import {
  aws_apigateway as apig,
  aws_lambda as lambda,
  aws_logs as logs,
  aws_route53 as r53,
  aws_secretsmanager as sm,
} from "aws-cdk-lib";
import { ValheimWorldStack } from "./valheim-world-stack";

export interface DiscordJsSfnInteractionsStackProps extends cdk.StackProps {
  readonly servers: Record<string, ValheimWorldStack>;
  readonly clientIdSecretId: string;
  readonly botTokenId: string;
  readonly hostedZone: r53.IHostedZone;
}

export class DiscordJsSfnInteractionsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: DiscordJsSfnInteractionsStackProps) {
    super(scope, id, props);

    const { servers, clientIdSecretId, hostedZone } = props;

    const clientPublicKeySecret = sm.Secret.fromSecretNameV2(this, "ClientPubKey", clientIdSecretId);

    const serverConfigs = Object.entries(servers).map(([name, stack]) => ({
      name,
      service: stack.world.service.serviceName,
      arn: stack.world.service.cluster.clusterArn,
      urlPrefix: stack.urlPrefix,
      startSfnArn: stack.startStateMachine.stateMachineArn,
      statusSfnArn: stack.statusStateMachine.stateMachineArn,
    }));

    const lambdaFunction = new lambda.Function(this, "Function", {
      code: new lambda.AssetCode("src/dist"),
      handler: "discord-js.discordInteractionsHandlerSfn",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        CLIENT_PUBLIC_KEY: clientPublicKeySecret.secretValueFromJson("CLIENT_PUBLIC_KEY").toString(),
        SERVER_CONFIG: JSON.stringify(serverConfigs),
        HOSTED_ZONE_ID: hostedZone.hostedZoneId,
        HOSTED_ZONE_NAME: hostedZone.zoneName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    Object.entries(servers)
      .flatMap(([, c]) => [c.startStateMachine, c.statusStateMachine])
      .forEach((stateMachine) => stateMachine.grantStartExecution(lambdaFunction.role!));

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
