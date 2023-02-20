import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";

export interface ValheimS3StackProps extends cdk.StackProps {
  readonly bucketName?: string;
}

export class ValheimS3Stack extends cdk.Stack {
  readonly bucket: s3.Bucket;
  constructor(scope: cdk.App, id: string, props: ValheimS3StackProps) {
    super(scope, id, props);
    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: props.bucketName,
    });
  }
}
