import * as cw from "@aws-cdk/aws-cloudwatch";
import * as cwa from "@aws-cdk/aws-cloudwatch-actions";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as es from "@aws-cdk/aws-lambda-event-sources";
import * as logs from "@aws-cdk/aws-logs";
import * as sns from "@aws-cdk/aws-sns";
import * as cdk from "@aws-cdk/core";
import { ValheimWorld } from "cdk-valheim";

export interface ValheimWorldStackProps extends cdk.StackProps {
  readonly environment: { [key: string]: string }
  readonly passwordSecretId: string
  readonly adminlistSecretId?: string
}

export class ValheimWorldStack extends cdk.Stack {
  public readonly world: ValheimWorld

  constructor(scope: cdk.Construct, id: string, props: ValheimWorldStackProps) {
    super(scope, id, props);

    this.world = new ValheimWorld(this, 'World', {
      cpu: 2048,
      memoryLimitMiB: 4096,
      desiredCount: 0,
      environment: {
        SERVER_PUBLIC: "1",
        UPDATE_CRON: "*/15 * * * *",
        BACKUPS_CRON: "10/15 * * * *",
        RESTART_CRON: "0 6 * * *",
        BACKUPS_DIRECTORY: "/config/backups",
        BACKUPS_MAX_AGE: "1",
        TZ: "US/Pacific",
        STATUS_HTTP: "true",
        SERVER_PASS: cdk.SecretValue.secretsManager(props.passwordSecretId, { jsonField: 'VALHEIM_SERVER_PASS' }).toString(),
        ADMINLIST_IDS: props.adminlistSecretId ?
          cdk.SecretValue.secretsManager(props.adminlistSecretId, { jsonField: 'ADMINLIST_IDS' }).toString() : '',
        ...props.environment,
      },
    })

    // allow 80 for status page. public because anyone can hit the query port anyways.
    // todo maybe consider only allowing the below function vpc to query?
    this.world.service.connections.allowFromAnyIpv4(ec2.Port.tcp(80))

    const metricLambdaFunction = new lambda.Function(this, 'MetricLoggerFunction', {
      code: new lambda.AssetCode('src/dist'),
      handler: 'cw-logging-lambda.loggingLambdaHandler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        SERVER_CLUSTER_ARN: this.world.service.cluster.clusterArn,
        SERVER_SERVICE_NAME: this.world.service.serviceName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // todo be more specific
    metricLambdaFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'))
    metricLambdaFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'))

    new events.Rule(this, 'ScheduledMetricLoggerRule', {
      schedule: events.Schedule.cron({}), // defaults to minutely
      targets: [new targets.LambdaFunction(metricLambdaFunction)],
    })

    // 0 players for 1 hour
    const lowPlayerCountAlarm = new cw.Alarm(this, 'LowPlayerCountAlarm', {
      metric: new cw.Metric({
        namespace: 'Valheim',
        metricName: 'PlayerCount',
        dimensions: {
          SERVICE_NAME: this.world.service.serviceName,
        },
        statistic: 'max'
      }),
      evaluationPeriods: 12,
      threshold: 1,
      comparisonOperator: cw.ComparisonOperator.LESS_THAN_THRESHOLD,
    })

    // server online for 1 hour
    const serverOnlineAlarm = new cw.Alarm(this, 'ServerOnlineAlarm', {
      metric: new cw.Metric({
        namespace: 'Valheim',
        metricName: 'Online',
        dimensions: {
          SERVICE_NAME: this.world.service.serviceName,
        },
        statistic: 'max'
      }),
      evaluationPeriods: 12,
      threshold: 1,
      comparisonOperator: cw.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    })

    // both of the above
    const shutoffAlarm = new cw.CompositeAlarm(this, 'TurnOffServerAlarm', {
      alarmRule: cw.AlarmRule.allOf(
        cw.AlarmRule.fromAlarm(lowPlayerCountAlarm, cw.AlarmState.ALARM),
        cw.AlarmRule.fromAlarm(serverOnlineAlarm, cw.AlarmState.ALARM),
      ),
    })

    const shutoffTopic = new sns.Topic(this, 'ShutoffTopic')

    const shutoffFunction = new lambda.Function(this, 'ShutdownFunction', {
      code: new lambda.AssetCode('src/dist'),
      handler: 'stop-server-lambda.stopServerLambdaHandler',
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        SERVER_CLUSTER_ARN: this.world.service.cluster.clusterArn,
        SERVER_SERVICE_NAME: this.world.service.serviceName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    })

    // todo be more specific
    shutoffFunction.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonECS_FullAccess'))

    // connect the alarm -> SNS -> lambda
    shutoffAlarm.addAlarmAction(new cwa.SnsAction(shutoffTopic))
    shutoffFunction.addEventSource(new es.SnsEventSource(shutoffTopic))
  }
}
