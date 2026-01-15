import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentStackPipeline } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { SampleSheetCheckerStack } from '../stage/stack';
import { getSampleSheetCheckerProps } from '../stage/config';

export class StatelessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentStackPipeline(this, 'DeploymentPipeline', {
      githubBranch: 'main',
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
      unitAppTestConfig: {
        partialBuildSpec: {
          phases: {
            install: {
              'runtime-versions': {
                python: '3.13',
              },
            },
          },
          version: '0.2',
        },
        command: ['cd app', 'make test'],
      },
      unitIacTestConfig: {
        partialBuildSpec: {
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '22',
              },
            },
          },
          version: '0.2',
        },
        command: [
          'npm install --global corepack@latest',
          'corepack enable',
          'pnpm install --frozen-lockfile --ignore-scripts',
          'pnpm test',
        ],
      },
    });
  }
}
