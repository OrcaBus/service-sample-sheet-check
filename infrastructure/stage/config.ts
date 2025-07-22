import { getDefaultApiGatewayConfiguration } from '@orcabus/platform-cdk-constructs/api-gateway';
import { SampleSheetCheckerStackProps } from './stack';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export const getSampleSheetCheckerProps = (stage: StageName): SampleSheetCheckerStackProps => {
  const metadataDomainNameDict: Record<StageName, string> = {
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
