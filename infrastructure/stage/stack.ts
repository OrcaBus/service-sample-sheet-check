import { Construct } from 'constructs';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod, HttpRoute, HttpRouteKey } from 'aws-cdk-lib/aws-apigatewayv2';

import path from 'path';
import { Architecture, DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import {
  OrcaBusApiGateway,
  OrcaBusApiGatewayProps,
} from '@orcabus/platform-cdk-constructs/api-gateway';

export interface SampleSheetCheckerStackProps {
  /**
   * The props for api-gateway
   */
  apiGatewayConstructProps: OrcaBusApiGatewayProps;
  /**
   * The domain name of the metadata service
   */
  metadataDomainName: string;
}

export class SampleSheetCheckerStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & SampleSheetCheckerStackProps) {
    super(scope, id, props);

    const apiGW = new OrcaBusApiGateway(
      this,
      'OrcaBusAPI-SampleSheetChecker',
      props.apiGatewayConstructProps
    );

    const logGroup = new LogGroup(this, 'EnvConfigLambdaLogGroup', {
      retention: RetentionDays.TWO_WEEKS,
    });

    // Bucket to retain a copy of every submitted sample sheet for auditing purposes.
    // RETAIN so audit history survives stack updates/deletions.
    const auditBucket = new Bucket(this, 'SampleSheetAuditBucket', {
      removalPolicy: RemovalPolicy.RETAIN,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });

    const sscheckLambda = new DockerImageFunction(this, 'SSCheckLambda', {
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '..', '..', 'app'), {
        file: 'lambda.Dockerfile',
      }),
      logGroup: logGroup,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(28),
      memorySize: 1024,
      environment: {
        METADATA_DOMAIN_NAME: props.metadataDomainName,
        SAMPLESHEET_AUDIT_BUCKET_NAME: auditBucket.bucketName,
      },
    });

    // Lambda only needs to write audit copies, never read or delete them.
    auditBucket.grantPut(sscheckLambda);

    // add some integration to the http api gw
    const apiIntegration = new HttpLambdaIntegration('ApiLambdaIntegration', sscheckLambda);

    // Routes for API schemas
    new HttpRoute(this, 'PostHttpRoute', {
      httpApi: apiGW.httpApi,
      integration: apiIntegration,
      routeKey: HttpRouteKey.with(`/{PROXY+}`, HttpMethod.POST),
    });
  }
}
