import * as pulumi from '@pulumi/pulumi'

import * as vpc from './utils/vpc'
import * as securitygroup from './utils/securitygroup'

import * as lambda from './utils/lambda'
import * as ecsservice from './services/ecs/service'
import * as lambdaservice from './services/lambda/service'

const main = async () => {
  const config = new pulumi.Config()
  const stack = pulumi.getStack()

  const defaultVpc = await vpc.GetDefaultVpc()
  const defaultSubnets = await vpc.GetDefaultSubnets(defaultVpc)
  const defaultSecurityGroup = securitygroup.NewDefaultSecurityGroup()

  // NOTE: Services initialization
  new ecsservice.Service(
    config,
    `${stack}-x-api`,
    defaultVpc,
    defaultSubnets,
  ).new({
    loadBalancer: {
      targetGroupPort: 80,
      isHttpsEnabled: false,
      securityGroup: defaultSecurityGroup,
    },
    ecs: {
      cpu: 128,
      memory: 512,
      desiredCount: 1,
      port: 80,
    },
    autoscaling: {
      minCapacity: 1,
      maxCapacity: 10,
      policies: [
        {
          type: `memory`,
          policyType: 'TargetTrackingScaling',
          predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          targetValue: 80,
          scaleInCooldown: 30,
          scaleOutCooldown: 60,
        },
        {
          type: `cpu`,
          policyType: 'TargetTrackingScaling',
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          targetValue: 70,
          scaleInCooldown: 30,
          scaleOutCooldown: 60,
        },
      ],
    },
  })

  new lambdaservice.Service(config, `${stack}-x`).new({
    language: lambda.JS,
    isFifo: true,
    isProd: true,
    isPublic: true,
    variables: {
      url: 'https://example.com',
      token: '123456789',
    },
  })
}

main()
