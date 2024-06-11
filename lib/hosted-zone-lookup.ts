import * as cdk from "aws-cdk-lib";
import { aws_route53 as r53 } from "aws-cdk-lib";
import { HostedZoneAttributes } from "aws-cdk-lib/aws-route53";

export interface HostedZoneStackProps extends cdk.StackProps {
  readonly hostedZoneAttrs: HostedZoneAttributes;
}

export class HostedZoneStack extends cdk.Stack {
  readonly hostedZone: r53.IHostedZone;

  constructor(scope: cdk.App, id: string, props: HostedZoneStackProps) {
    super(scope, id, props);
    const { hostedZoneAttrs } = props;
    this.hostedZone = r53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", hostedZoneAttrs);
  }
}
