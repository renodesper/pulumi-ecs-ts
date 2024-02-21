import * as pulumi from '@pulumi/pulumi';

import { GetDefaultVpc, GetDefaultSubnets } from './utils/vpc';
import { NewDefaultSecurityGroup } from './utils/securitygroup';
import { EcsService } from './services/ecs';

const config = new pulumi.Config();
const stack = pulumi.getStack();

// NOTE: Default resources initialization
const defaultVpc = GetDefaultVpc();
const defaultSubnets = GetDefaultSubnets(defaultVpc);
const defaultSecurityGroup = NewDefaultSecurityGroup();

// NOTE: Services initialization
new EcsService(config, `${stack}-x-api`, defaultVpc, defaultSubnets).new({
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
});
