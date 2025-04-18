import { Construct } from 'constructs';
import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpMethod, HttpRoute, HttpRouteKey } from 'aws-cdk-lib/aws-apigatewayv2';

import path from 'path';
import { Architecture, DockerImageCode, DockerImageFunction } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
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

    const sscheckLambda = new DockerImageFunction(this, 'SSCheckLambda', {
      code: DockerImageCode.fromImageAsset(path.join(__dirname, '..', '..', 'app'), {
        file: 'lambda.Dockerfile',
      }),
      logRetention: RetentionDays.TWO_WEEKS,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(28),
      memorySize: 1024,
      environment: {
        METADATA_DOMAIN_NAME: props.metadataDomainName,
      },
    });

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
