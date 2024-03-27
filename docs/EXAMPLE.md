## Example

Below are examples of how to instantiate each service. Put it in the `index.ts` file.

### ECS

```typescript
const config = new pulumi.Config()
const stack = pulumi.getStack()

const defaultVpc = await vpc.GetDefaultVpc()
const defaultSubnets = await vpc.GetDefaultSubnets(defaultVpc)
const defaultSecurityGroup = securitygroup.NewDefaultSecurityGroup()

const service = new ecsservice.Service(
  config,
  stack,
  'name', // name will be used as the base name for load balancer, target group, repo, cluster, etc
  defaultVpc,
  defaultSubnets
)
service.New({
  loadBalancer: {
    targetGroupPort: 80,
    isHttpsEnabled: false,
    securityGroup: defaultSecurityGroup,
  },
  secretsManager: {
    isEnabled: false,
    variables: [],
  },
  ecr: {
    imagePath: './src/services/ecs/app',
  },
  ecs: {
    isEnabled: false,
    cpu: 128,
    memory: 512,
    desiredCount: 1,
    port: 80,
  },
  autoscaling: {
    isEnabled: false,
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
```

### Lambda

```typescript
const config = new pulumi.Config()
const stack = pulumi.getStack()

const defaultVpc = await vpc.GetDefaultVpc()

const service = new lambdaservice.Service(config, stack, 'name')
service.New({
  language: lambda.JS,
  isFifo: true,
  isProd: true,
  isPublic: true,
  variables: {
    url: 'https://httpbin.dev/post',
    token: '123456789',
  },
  archive: new pulumi.asset.FileArchive(
    './src/services/lambda/function/app.zip'
  ),
})
```
