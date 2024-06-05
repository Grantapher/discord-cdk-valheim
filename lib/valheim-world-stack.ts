import { ValheimWorld } from "cdk-valheim";
import * as cdk from "aws-cdk-lib";
import {
  aws_cloudwatch as cw,
  aws_cloudwatch_actions as cwa,
  aws_ec2 as ec2,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_lambda_event_sources as es,
  aws_logs as logs,
  aws_sns as sns,
  Duration,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ValheimWorldStackProps extends cdk.StackProps {
  readonly environment: { [key: string]: string };
  readonly passwordSecretId: string;
  readonly adminlistSecretId?: string;
}

export class ValheimWorldStack extends cdk.Stack {
  public readonly world: ValheimWorld;

  constructor(scope: Construct, id: string, props: ValheimWorldStackProps) {
    super(scope, id, props);

    this.world = new ValheimWorld(this, "World", {
      cpu: 2048,
      memoryLimitMiB: 4096,
      desiredCount: 0,
      environment: {
        SERVER_PUBLIC: "true",
        UPDATE_CRON: "*/15 * * * *",
        BACKUPS_CRON: "10/15 * * * *",
        RESTART_CRON: "0 6 * * *",
        BACKUPS_DIRECTORY: "/config/backups",
        BACKUPS_MAX_AGE: "1",
        TZ: "US/Pacific",
        STATUS_HTTP: "true",
        SERVER_PASS: cdk.SecretValue.secretsManager(props.passwordSecretId, {
          jsonField: "VALHEIM_SERVER_PASS",
        }).toString(),
        ADMINLIST_IDS: props.adminlistSecretId
          ? cdk.SecretValue.secretsManager(props.adminlistSecretId, {
              jsonField: "ADMINLIST_IDS",
            }).toString()
          : "",
        ...props.environment,
      },
    });

    // allow 80 for status page. public because anyone can hit the query port anyways.
    // todo maybe consider only allowing the below function vpc to query?
    this.world.service.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    const metricLambdaFunction = new lambda.Function(this, "MetricLoggerFunction", {
      code: new lambda.AssetCode("src/dist"),
      handler: "cw-logging-lambda.loggingLambdaHandler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      environment: {
        SERVER_CLUSTER_ARN: this.world.service.cluster.clusterArn,
        SERVER_SERVICE_NAME: this.world.service.serviceName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // todo be more specific
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const metricLambdaFunctionRole = metricLambdaFunction.role!;
    metricLambdaFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"));
    metricLambdaFunctionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));

    new events.Rule(this, "ScheduledMetricLoggerRule", {
      schedule: events.Schedule.cron({
        minute: "*",
      }), // defaults to minutely
      targets: [new targets.LambdaFunction(metricLambdaFunction)],
    });

    // 0 players for 1 hour
    const lowPlayerCountAlarm = new cw.Alarm(this, "LowPlayerCountAlarm", {
      metric: new cw.Metric({
        namespace: "Valheim",
        metricName: "PlayerCount",
        dimensionsMap: {
          SERVICE_NAME: this.world.service.serviceName,
        },
        statistic: "max",
      }),
      evaluationPeriods: 12,
      threshold: 1,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    // server online for 1 hour
    const serverOnlineAlarm = new cw.Alarm(this, "ServerOnlineAlarm", {
      metric: new cw.Metric({
        namespace: "Valheim",
        metricName: "Online",
        dimensionsMap: {
          SERVICE_NAME: this.world.service.serviceName,
        },
        statistic: "max",
      }),
      evaluationPeriods: 12,
      threshold: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });

    // both of the above
    const shutoffAlarm = new cw.CompositeAlarm(this, "TurnOffServerAlarm", {
      alarmRule: cw.AlarmRule.allOf(
        cw.AlarmRule.fromAlarm(lowPlayerCountAlarm, cw.AlarmState.ALARM),
        cw.AlarmRule.fromAlarm(serverOnlineAlarm, cw.AlarmState.ALARM)
      ),
    });

    const shutoffTopic = new sns.Topic(this, "ShutoffTopic");

    const shutoffFunction = new lambda.Function(this, "ShutdownFunction", {
      code: new lambda.AssetCode("src/dist"),
      handler: "stop-server-lambda.stopServerLambdaHandler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      environment: {
        SERVER_CLUSTER_ARN: this.world.service.cluster.clusterArn,
        SERVER_SERVICE_NAME: this.world.service.serviceName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // todo be more specific
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    shutoffFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECS_FullAccess"));

    // connect the alarm -> SNS -> lambda
    shutoffAlarm.addAlarmAction(new cwa.SnsAction(shutoffTopic));
    shutoffFunction.addEventSource(new es.SnsEventSource(shutoffTopic));
  }
}
