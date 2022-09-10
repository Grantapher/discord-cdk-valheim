import * as cw from "@aws-sdk/client-cloudwatch";
import * as ec2 from "@aws-sdk/client-ec2";
import * as ecs from "@aws-sdk/client-ecs";
import fetch from "node-fetch";
import { ScheduledHandler } from "aws-lambda";

const ecsClient = new ecs.ECS({});
const cwClient = new cw.CloudWatch({});

export const loggingLambdaHandler: ScheduledHandler = async () => {
  const clusterArn = process.env.SERVER_CLUSTER_ARN;
  if (!clusterArn) {
    console.error("No clusterArn configured!");
  }

  const serviceName = process.env.SERVER_SERVICE_NAME;
  if (!serviceName) {
    console.error("No serviceName configured!");
  }

  if (!clusterArn || !serviceName) {
    return;
  }

  const dimensions: cw.Dimension[] = [
    {
      Name: "SERVICE_NAME",
      Value: serviceName,
    },
  ];

  const metrics = await getMetrics(clusterArn, serviceName);

  cwClient.putMetricData({
    Namespace: "Valheim",
    MetricData: [
      {
        MetricName: "Online",
        Value: metrics.online ? 1 : 0,
        Unit: "None",
        Dimensions: dimensions,
      },
      {
        MetricName: "PlayerCount",
        Value: metrics.count,
        Unit: "None",
        Dimensions: dimensions,
      },
    ],
  });
};

const emptyMetrics = { online: false, count: 0 };

const getMetrics: (clusterArn: string, serviceName: string) => Promise<{ online: boolean; count: number }> = async (
  clusterArn,
  serviceName
) => {
  const describeServicesResponse = await ecsClient
    .describeServices({
      cluster: clusterArn,
      services: [serviceName],
    })
    .catch((e) => {
      console.error(e);
      return undefined;
    });

  const service = describeServicesResponse?.services?.find(any);

  if (!service || (service.runningCount ?? 0) < 1) {
    return emptyMetrics;
  }

  const niDescription = await ecsClient
    .listTasks({ cluster: service.clusterArn })
    .then((listTasksResp) =>
      ecsClient.describeTasks({
        tasks: listTasksResp.taskArns,
        cluster: service.clusterArn,
      })
    )
    .then((describeTasksResp) => {
      const eniId = describeTasksResp.tasks
        ?.find(any)
        ?.attachments?.find(any)
        ?.details?.find((pair) => pair.name === "networkInterfaceId")?.value;

      if (!eniId) {
        return;
      }

      return new ec2.EC2({}).describeNetworkInterfaces({
        NetworkInterfaceIds: [eniId],
      });
    })
    .catch((e) => {
      console.error(e);
      return undefined;
    });

  const publicIp = niDescription?.NetworkInterfaces?.find(any)?.Association?.PublicIp;
  if (!publicIp) {
    return emptyMetrics;
  }

  // todo make a type result for the status.json result
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const status: any | undefined = await fetch(`http://${publicIp}/status.json`)
    .then((res) => res.json())
    .catch((e) => {
      console.error(e);
      return undefined;
    });

  if (!status || status.error !== null) {
    return emptyMetrics;
  }

  const numPlayers = status.player_count as number;
  return { online: true, count: numPlayers };
};

// for use in find so that .find(any) returns the first item or undef
const any = () => true;
