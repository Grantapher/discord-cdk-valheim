import * as cdk from "aws-cdk-lib";
import { aws_secretsmanager as sm } from "aws-cdk-lib";

export interface ValheimSecretStackProps extends cdk.StackProps {
  readonly valheimWebhookSecretId: string;
}

export class ValheimSecretStack extends cdk.Stack {
  readonly valheimWebhookSecret: sm.ISecret;
  constructor(scope: cdk.App, id: string, props: ValheimSecretStackProps) {
    super(scope, id, props);
    this.valheimWebhookSecret = sm.Secret.fromSecretNameV2(this, "WebhookSecret", props.valheimWebhookSecretId);
  }
}
