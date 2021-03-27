import * as ec2 from '@aws-sdk/client-ec2';
import * as ecs from '@aws-sdk/client-ecs';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { InteractionResponseFlags, InteractionResponseType, InteractionType, verifyKey } from "discord-interactions";
import fetch from 'node-fetch';

// injected via lambda env
interface ServerConfig {
  readonly name: string
  readonly service: string
  readonly arn: string
}

export const discordSlashCommandLambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const signature = getHeader(event, 'X-Signature-Ed25519')
  const timestamp = getHeader(event, 'X-Signature-Timestamp')

  if (!signature || !timestamp) {
    console.log(event)
    console.error('Missing headers')
    return response(401, `Missing signature headers`)
  } else if (!process.env.CLIENT_PUBLIC_KEY) {
    console.log(event)
    console.error('Missing public key env var')
    return response(500, `Internal Server Error`)
  } else if (!verifyKey(event.body || '', signature, timestamp, process.env.CLIENT_PUBLIC_KEY)) {
    console.log(event)
    console.error('Key not verified')
    return response(401, `Bad request signature`)
  } else if (!event.body) {
    console.log(event)
    console.error('Found empty body')
    return response(400, `Empty request body`)
  }

  const body = JSON.parse(event.body)

  // check for ping
  if (body.type === InteractionType.PING) {
    console.log('Received ping, returning pong')
    return response(200, { type: InteractionResponseType.PONG })
  }

  // start actual handling
  console.log(`Actual request. Body: ${JSON.stringify(body, null, 4)}`)
  const serverConfigString = process.env.SERVER_CONFIG

  if (!serverConfigString) {
    console.log('No servers configured!')
  }

  const serverConfigs = JSON.parse(serverConfigString ?? '[]') as ServerConfig[]

  console.log(`Server Config: ${JSON.stringify(serverConfigs)}`)

  const option = body.data.options[0]
  switch (option.name) {
    case "list":
      return list(serverConfigs)
    case "start":
      return await start(serverConfigs, option.options[0].value)
    case "stop":
      return await stop(serverConfigs, option.options[0].value)
    case "status":
      return await status(serverConfigs, option.options[0].value)
    default:
      console.error(`Found unexpected command: "${option.name}"`);
      return contentResponse('Unexpected command.')
  }

}

const list = async (configs: ServerConfig[]) => {
  return contentResponse(`Configured servers:\n${configs.map(config => `  - \`${config.name}\``).join('\n')}`)
}

const start = async (configs: ServerConfig[], name: string) => {
  const config = findServerConfig(configs, name)
  if (!config) {
    return noSuchServerResponse(name)
  }

  const client = new ecs.ECS({})
  const updateServicePromise = await client.updateService({
    cluster: config.arn,
    service: config.service,
    desiredCount: 1,
  })
    .then(() => true)
    .catch(e => {
      console.error(e)
      return false
    })

  const success = await updateServicePromise
  if (!success) {
    return contentResponse(`Couldn't set status of \`${config.name}\`.`)
  }

  return contentResponse(`Set status of \`${config.name}\` to **on**.`)
}

const stop = async (configs: ServerConfig[], name: string) => {
  const config = findServerConfig(configs, name)
  if (!config) {
    return noSuchServerResponse(name)
  }

  const client = new ecs.ECS({})
  const updateServicePromise = await client.updateService({
    cluster: config.arn,
    service: config.service,
    desiredCount: 0,
  })
    .then(() => true)
    .catch(e => {
      console.error(e)
      return false
    })

  const success = await updateServicePromise
  if (!success) {
    return contentResponse(`Couldn't set status of \`${config.name}\`.`)
  }

  return contentResponse(`Set status of \`${config.name}\` to **off**.`)
}

const status = async (configs: ServerConfig[], name: string) => {
  // todo add interaction param once it is a custom resource so that this isn't hardcoded.
  const debug = false

  const config = findServerConfig(configs, name)
  if (!config) {
    return noSuchServerResponse(name)
  }

  const client = new ecs.ECS({})
  const describeServicesResponse = await client.describeServices({
    cluster: config.arn,
    services: [config.service],
  }).catch(e => {
    console.error(e)
    return undefined
  })

  const service = describeServicesResponse?.services?.find(any)

  if (!service) {
    return contentResponse(`Couldn't find the configured service. Try again in a bit.`)
  }

  let serverContent = `Server: \`${name}\`\n`
  let statusContent = `Status: **${getStatus(service, false)}**\n`
  let debugContent = ''
  if (debug) {
    debugContent = `\nDebug info below\n`
      + `Desired: ${service.desiredCount ? 'Yes' : 'No'}\n`
      + `Running: ${service.runningCount ? 'Yes' : 'No'}\n`
      + `Pending: ${service.pendingCount ? 'Yes' : 'No'}\n`
  }

  if ((service.runningCount ?? 0) < 1) {
    return contentResponse(serverContent + statusContent + debugContent)
  }

  const taskDefPromise = client.describeTaskDefinition({ taskDefinition: service.taskDefinition })
    .catch(e => {
      console.error(e)
      return undefined
    })

  const niDescriptionPromise = client.listTasks({ cluster: service.clusterArn })
    .then(listTasksResp => client.describeTasks({
      tasks: listTasksResp.taskArns,
      cluster: service.clusterArn,
    }))
    .then(describeTasksResp => {
      const eniId = describeTasksResp.tasks?.find(any)?.attachments?.find(any)?.details
        ?.find(pair => pair.name === "networkInterfaceId")?.value

      if (!eniId) {
        return
      }

      return new ec2.EC2({}).describeNetworkInterfaces({ NetworkInterfaceIds: [eniId] })
    })
    .catch(e => {
      console.error(e)
      return undefined
    })

  const taskDef = await taskDefPromise
  const niDescription = await niDescriptionPromise

  const valheimEnv = taskDef?.taskDefinition?.containerDefinitions?.find(any)?.environment
  const pass = valheimEnv?.find(pair => pair.name === "SERVER_PASS")?.value
  const port = valheimEnv?.find(pair => pair.name === "SERVER_PORT")?.value ?? '2456'

  let passContent = ''
  if (pass) {
    passContent = `Password: \`${pass}\`\n`
  }

  const publicIp = niDescription?.NetworkInterfaces?.find(any)?.Association?.PublicIp

  let ipContent = ''
  if (publicIp) {
    ipContent = `IP Address: \`${publicIp}\`\n`
  }

  let joinLinkContent = ''
  if (pass && publicIp) {
    joinLinkContent = `**One-Click Join** (Game must not be already open): `
      + `steam://run/892970//-console%20%2Bconnect%20${publicIp}%3A${port}%20%2Bpassword%20${pass}\n`
  }

  const status = await fetch(`http://${publicIp}/status.json`)
    .then(res => res.json())
    .catch(e => {
      console.error(e)
      return undefined
    })

  const serverUp = (status?.error ?? null) === null

  statusContent = `Status: **${getStatus(service, serverUp)}**\n`

  let countContent = ''
  if (serverUp) {
    countContent = `Player Count: ${status.player_count}\n`
  }

  if (debug) {
    debugContent += `serverUp: ${serverUp ? 'Yes' : 'No'}\n`
  }

  return contentResponse(
    serverContent + statusContent + countContent + joinLinkContent + ipContent + passContent + debugContent)
}

const getStatus = (service: ecs.Service, online: boolean) => {
  switch (`${online ? 1 : 0}${service.runningCount}${service.desiredCount}${service.pendingCount}`) {
    case "0000":
      return 'Shut Down'
    case "0010":
      return 'Startup Request Accepted'
    case "0011":
      return 'Provisioning'
    case "0100":
      return 'Shutting Down'
    case "0110":
      return 'Starting Game'
    case "1100":
      return 'Quitting Game'
    case "1110":
      return 'Online'
    default:
      return 'Unknown'
  }

}

const findServerConfig: (configs: ServerConfig[], name: string) => ServerConfig | undefined =
  (configs, name) => configs.find(config => config.name === name)

const noSuchServerResponse = (name: string) =>
  contentResponse(`Could not find server config \`${name}\`.\n`
    + 'Try running `/vh list` to see the available servers.')

const getHeader = (event: APIGatewayProxyEvent, key: string) => Object.entries(event.headers)
  .find(([entryKey, _]) => entryKey.toLowerCase() === key.toLowerCase())
  ?.[1]

const response: (statusCode: number, body: any) => APIGatewayProxyResult = (statusCode: number, body: any) => ({
  statusCode,
  body: JSON.stringify(body)
})

const contentResponse = (content: string, ephemeral?: boolean) => response(200, {
  type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  data: {
    content,
    flags: ephemeral ? InteractionResponseFlags.EPHEMERAL : undefined,
  }
})

// for use in find so that .find(any) returns the first item or undef
const any = () => true