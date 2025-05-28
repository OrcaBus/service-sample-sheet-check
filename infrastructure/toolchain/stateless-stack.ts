import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentStackPipeline } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { SampleSheetCheckerStack } from '../stage/stack';
import { getSampleSheetCheckerProps } from '../stage/config';

export class StatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentStackPipeline(this, 'DeploymentPipeline', {
      githubBranch: 'chore/upgrade-codepipeline-version',
      githubRepo: 'service-sample-sheet-check',
      stack: SampleSheetCheckerStack,
      stackName: 'SampleSheetCheckerStack',
      stackConfig: {
        beta: getSampleSheetCheckerProps('BETA'),
        gamma: getSampleSheetCheckerProps('GAMMA'),
        prod: getSampleSheetCheckerProps('PROD'),
      },
      pipelineName: 'OrcaBus-StatelessSampleSheetCheck',
      cdkSynthCmd: ['pnpm install --frozen-lockfile --ignore-scripts', 'pnpm cdk synth'],
      enableSlackNotification: false,
      reuseExistingArtifactBucket: true,
    });
  }
}
