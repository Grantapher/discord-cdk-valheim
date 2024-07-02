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
  aws_route53 as r53,
  aws_sns as sns,
  aws_stepfunctions as sfn,
  aws_stepfunctions_tasks as tasks,
} from "aws-cdk-lib";
import { Construct } from "constructs";

export interface ValheimWorldStackProps extends cdk.StackProps {
  readonly worldName: string;
  readonly environment: { [key: string]: string };
  readonly passwordSecretId: string;
  readonly adminlistSecretId?: string;
  readonly hostedZone: r53.IHostedZone;
  readonly urlPrefix: string;
}

export class ValheimWorldStack extends cdk.Stack {
  public readonly world: ValheimWorld;
  public readonly urlPrefix: string;
  public readonly startStateMachine: sfn.StateMachine;
  public readonly statusStateMachine: sfn.StateMachine;

  constructor(scope: Construct, id: string, props: ValheimWorldStackProps) {
    super(scope, id, props);

    const { worldName, environment, passwordSecretId, adminlistSecretId, hostedZone, urlPrefix } = props;
    this.urlPrefix = urlPrefix;
    this.world = new ValheimWorld(this, "World", {
      cpu: 2048,
      memoryLimitMiB: 4096,
      desiredCount: 0,
      environment: {
        SERVER_NAME: worldName,
        WORLD_NAME: worldName,
        SERVER_PUBLIC: "true",
        UPDATE_CRON: "*/15 * * * *",
        BACKUPS_CRON: "10/15 * * * *",
        RESTART_CRON: "0 6 * * *",
        BACKUPS_DIRECTORY: "/config/backups",
        BACKUPS_MAX_AGE: "1",
        TZ: "US/Pacific",
        STATUS_HTTP: "true",
        SERVER_PASS: cdk.SecretValue.secretsManager(passwordSecretId, {
          jsonField: "VALHEIM_SERVER_PASS",
        }).toString(),
        ADMINLIST_IDS: adminlistSecretId
          ? cdk.SecretValue.secretsManager(adminlistSecretId, {
              jsonField: "ADMINLIST_IDS",
            }).toString()
          : "",
        ...environment,
      },
    });

    // allow 80 for status page. public because anyone can hit the query port anyways.
    // todo maybe consider only allowing the below function vpc to query?
    this.world.service.connections.allowFromAnyIpv4(ec2.Port.tcp(80));

    const metricLambdaFunction = new lambda.Function(this, "MetricLoggerFunction", {
      code: new lambda.AssetCode("src/dist"),
      handler: "cw-logging-lambda.loggingLambdaHandler",
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
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
      timeout: cdk.Duration.seconds(10),
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

    this.startStateMachine = createStartStateMachine(this, worldName);
    this.statusStateMachine = createStatusStateMachine(this, hostedZone, worldName);
  }
}

function createStartStateMachine(stack: ValheimWorldStack, worldName: string): sfn.StateMachine {
  const service = stack.world.service;
  const clusterArn = service.cluster.clusterArn;
  const serviceName = service.serviceName;
  const serviceArn = service.serviceArn;

  const startInstanceTask = new tasks.CallAwsService(stack, "StartUpdateService", {
    stateName: "UpdateService Start",
    service: "ecs",
    action: "updateService",
    parameters: {
      Cluster: clusterArn,
      Service: serviceName,
      DesiredCount: 1,
    },
    iamResources: [serviceArn],
  });

  const finish = new sfn.Pass(stack, "Start Finish", { stateName: "Succeeded" });
  const definition = startInstanceTask.next(finish);

  return new sfn.StateMachine(stack, "StartStateMachine", {
    definitionBody: sfn.DefinitionBody.fromChainable(definition),
    timeout: cdk.Duration.minutes(1),
    comment: `Turns on ${worldName}.`,
  });
}

function createStatusStateMachine(stack: ValheimWorldStack, hostedZone: r53.IHostedZone, worldName: string) {
  const service = stack.world.service;
  const clusterArn = service.cluster.clusterArn;
  const serviceName = service.serviceName;
  const serviceArn = service.serviceArn;
  const taskDefinitionArn = service.taskDefinition.taskDefinitionArn;

  const describeServices = new tasks.CallAwsService(stack, "DescribeServices", {
    service: "ecs",
    action: "describeServices",
    parameters: {
      Cluster: clusterArn,
      Services: [serviceName],
    },
    resultSelector: {
      "DesiredCount.$": "$.Services[0].DesiredCount",
      "RunningCount.$": "$.Services[0].RunningCount",
      "PendingCount.$": "$.Services[0].PendingCount",
      "ClusterArn.$": "$.Services[0].ClusterArn",
      "TaskDefinition.$": "$.Services[0].TaskDefinition",
    },
    resultPath: "$.DescribeServices",
    iamResources: [serviceArn],
  });

  const listTasksArnComponents = {
    ...stack.splitArn(clusterArn, cdk.ArnFormat.SLASH_RESOURCE_NAME),
    resource: "container-instance",
  };

  const listTasks = new tasks.CallAwsService(stack, "ListTasks", {
    service: "ecs",
    action: "listTasks",
    parameters: {
      Cluster: clusterArn,
      ServiceName: serviceName,
    },
    resultPath: "$.ListTasks",
    iamResources: [`${stack.formatArn(listTasksArnComponents)}/*`],
  });

  const describeTaskDefinition = new tasks.CallAwsService(stack, "DescribeTaskDefinition", {
    service: "ecs",
    action: "describeTaskDefinition",
    parameters: { TaskDefinition: taskDefinitionArn },
    resultSelector: {
      "ServerPassword.$": "$.TaskDefinition.ContainerDefinitions[0].Environment[?(@.Name == 'SERVER_PASS')].Value",
    },
    resultPath: "$.DescribeTaskDefinition",
    iamResources: ["*"], // resource-level permissions are not supported
  });

  const describeTasksArnComponents = {
    ...stack.splitArn(clusterArn, cdk.ArnFormat.SLASH_RESOURCE_NAME),
    resource: "task",
  };
  const describeTasks = new tasks.CallAwsService(stack, "DescribeTasks", {
    service: "ecs",
    action: "describeTasks",
    parameters: {
      Cluster: clusterArn,
      Tasks: sfn.JsonPath.stringAt("$.ListTasks.TaskArns"),
    },
    resultSelector: {
      "EniId.$": "$.Tasks[0].Attachments[0].Details[?(@.Name == 'networkInterfaceId')].Value",
    },
    resultPath: "$.DescribeTasks",
    iamResources: [`${stack.formatArn(describeTasksArnComponents)}/*`],
  });

  const describeNetworkInterfaces = new tasks.CallAwsService(stack, "DescribeNetworkInterfaces", {
    service: "ec2",
    action: "describeNetworkInterfaces",
    parameters: {
      NetworkInterfaceIds: sfn.JsonPath.stringAt("$.DescribeTasks.EniId"),
    },
    resultSelector: {
      "PublicIp.$": "$.NetworkInterfaces[0].Association.PublicIp",
    },
    resultPath: "$.DescribeNetworkInterfaces",
    iamResources: ["*"], // resource-level permissions are not supported
  });

  // todo this can be moved outside of getInfoParallel,
  //  since it is auxiliary to the actual needs of the getInfoParallel
  //  actually, probably should re-evaluate where any of them are necessary.
  const url = `${stack.urlPrefix}.${hostedZone.zoneName}`;
  const listResourceRecordSets = new tasks.CallAwsService(stack, "ListResourceRecordSets", {
    service: "route53",
    action: "listResourceRecordSets",
    parameters: {
      HostedZoneId: hostedZone.hostedZoneId,
      StartRecordType: "A",
      StartRecordName: url,
    },
    resultSelector: {
      "UrlIp.$": "$.ResourceRecordSets[0].ResourceRecords[0].Value",
    },
    resultPath: "$.ListResourceRecordSets",
    iamResources: [hostedZone.hostedZoneArn],
  });

  const changeResourceRecordSets = new tasks.CallAwsService(stack, "ChangeResourceRecordSets", {
    service: "route53",
    action: "changeResourceRecordSets",
    parameters: {
      HostedZoneId: hostedZone.hostedZoneId,
      ChangeBatch: {
        Comment: "Update IP to new server instance.",
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: url,
              Type: "A",
              Ttl: 30,
              ResourceRecords: [
                {
                  Value: sfn.JsonPath.stringAt("$.DescribeNetworkInterfaces.PublicIp"),
                },
              ],
            },
          },
        ],
      },
    },
    // resultSelector: {
    //   "UrlIp.$": "$.ResourceRecordSets[0].ResourceRecords[0].Value",
    // },
    resultPath: "$.ChangeResourceRecordSets",
    iamResources: [hostedZone.hostedZoneArn],
  });

  const fetchLambda = new lambda.Function(stack, "FetchFunction", {
    code: new lambda.AssetCode("src/dist"),
    handler: "fetch.fetchHandler",
    runtime: lambda.Runtime.NODEJS_20_X,
    timeout: cdk.Duration.minutes(1),
    logRetention: logs.RetentionDays.ONE_WEEK,
  });

  // noinspection HttpUrlsUsage
  const fetchTask = new tasks.LambdaInvoke(stack, "InvokeFetch", {
    stateName: "FetchStatus",
    lambdaFunction: fetchLambda,
    payload: sfn.TaskInput.fromObject({
      url: sfn.JsonPath.format("http://{}/status.json", sfn.JsonPath.stringAt("$.DescribeNetworkInterfaces.PublicIp")),
    }),
    payloadResponseOnly: true,
    resultPath: "$.Fetch",
  });

  const getInfoParallel = new sfn.Parallel(stack, "Get info", {
    resultSelector: {
      "Input.$": "$[0].Input",
      "DescribeServices.$": "$[0].DescribeServices",
      "DescribeTaskDefinition.$": "$[0].DescribeTaskDefinition",
      "DescribeNetworkInterfaces.$": "$[1].DescribeNetworkInterfaces",
      "Fetch.$": "$[1].Fetch",
      "ListResourceRecordSets.$": "$[2].ListResourceRecordSets",
    },
  });

  const useInfoParallel = new sfn.Parallel(stack, "Use Info", {
    // resultSelector: {
    //   "DescribeNetworkInterfaces.$": "$[0].DescribeNetworkInterfaces",
    //   "ListResourceRecordSets.$": "$[1].ListResourceRecordSets",
    // },
  });

  const getStatusDefinition = listTasks.next(describeTasks).next(describeNetworkInterfaces).next(fetchTask);

  const publicIpNotSetCondition = sfn.Condition.not(
    sfn.Condition.stringEqualsJsonPath("$.DescribeNetworkInterfaces.PublicIp", "$.ListResourceRecordSets.UrlIp")
  );

  const setPublicIpChoose = new sfn.Choice(stack, "Is DNS Set?")
    .when(publicIpNotSetCondition, new sfn.Pass(stack, "DNS not yet set").next(changeResourceRecordSets))
    .otherwise(new sfn.Pass(stack, "DNS already set"));

  const useInfoParallelDefinition = useInfoParallel
    .branch(new sfn.Pass(stack, "TODO update status with info"))
    .branch(setPublicIpChoose);

  const getInfoParallelDefinition = getInfoParallel
    .branch(describeTaskDefinition)
    .branch(getStatusDefinition)
    .branch(listResourceRecordSets)
    .next(useInfoParallelDefinition);

  const runningBranch = new sfn.Pass(stack, "Running").next(getInfoParallelDefinition);
  const isNotRunningCondition = sfn.Condition.numberLessThanEquals("$.DescribeServices.RunningCount", 0);

  const start = new sfn.Pass(stack, "Reorganize Input", {
    parameters: {
      Input: {
        "Id.$": "$.id",
        "Token.$": "$.token",
      },
    },
  }).next(describeServices);

  const definition = start.next(
    new sfn.Choice(stack, "Is Task Running?")
      .when(
        isNotRunningCondition,
        new sfn.Pass(stack, "Not Running").next(new sfn.Pass(stack, "TODO update status stopped"))
      )
      .otherwise(runningBranch)
  );

  return new sfn.StateMachine(stack, "StatusStateMachine", {
    definitionBody: sfn.DefinitionBody.fromChainable(definition),
    timeout: cdk.Duration.minutes(1),
    comment: `Gets the status of ${worldName}.`,
  });
}
