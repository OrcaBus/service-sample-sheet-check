import { StageName } from '@orcabus/platform-cdk-constructs/utils';
import { SampleSheetCheckerStackProps } from './stack';
import { getDefaultApiGatewayConfiguration } from '@orcabus/platform-cdk-constructs/api-gateway';

export const getSampleSheetCheckerProps = (stage: StageName): SampleSheetCheckerStackProps => {
  const metadataDomainNameDict = {
    BETA: 'metadata.dev.umccr.org',
    GAMMA: 'metadata.stg.umccr.org',
    PROD: 'metadata.prod.umccr.org',
  };

  return {
    apiGatewayConstructProps: {
      ...getDefaultApiGatewayConfiguration(stage),
      apiName: 'SSCheck',
      customDomainNamePrefix: 'sscheck-orcabus',
    },
    metadataDomainName: metadataDomainNameDict[stage],
  };
};
