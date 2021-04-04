import * as ecs from '@aws-sdk/client-ecs';
import { SNSEvent } from "aws-lambda";

export const stopServerLambdaHandler = async (event: SNSEvent): Promise<any> => {
  console.log(`Event: ${JSON.stringify(event)}`)

  const clusterArn = process.env.SERVER_CLUSTER_ARN
  if (!clusterArn) {
    console.error('No clusterArn configured!')
  } else {
    console.log(`Cluster ARN: ${clusterArn}`)
  }

  const serviceName = process.env.SERVER_SERVICE_NAME
  if (!serviceName) {
    console.error('No serviceName configured!')
  } else {
    console.log(`Service Name: ${serviceName}`)
  }

  if (!clusterArn || !serviceName) {
    return
  }

  const client = new ecs.ECS({})
  return client.updateService({
    cluster: clusterArn,
    service: serviceName,
    desiredCount: 0,
  }).catch(e => {
    console.error(e)
    return false
  })
}