import * as pulumi from '@pulumi/pulumi'

import * as iam from './src/utils/aws/iam'
import * as lambda from './src/utils/aws/lambda'
import * as securitygroup from './src/utils/aws/securitygroup'
import * as vpc from './src/utils/aws/vpc'
import * as ecsservice from './src/services/ecs/service'
import * as lambdaservice from './src/services/lambda/service'

const main = async () => {
  const config = new pulumi.Config()
  const stack = pulumi.getStack()

  const defaultVpc = await vpc.GetDefaultVpc()
  const defaultSubnets = await vpc.GetDefaultSubnets(defaultVpc)
  const defaultSecurityGroup = securitygroup.NewDefaultSecurityGroup()

  // NOTE: Initialize new ECS service called "x"
  // const xEcs = new ecsservice.Service(
  //   config,
  //   stack,
  //   'x',
  //   defaultVpc,
  //   defaultSubnets
  // )
  // xEcs.New({
  //   loadBalancer: {
  //     targetGroupPort: 80,
  //     isHttpsEnabled: false,
  //     securityGroup: defaultSecurityGroup,
  //   },
  //   secretsManager: {
  //     isEnabled: false,
  //     variables: [],
  //   },
  //   ecr: {
  //     imagePath: './src/services/ecs/app',
  //   },
  //   ecs: {
  //     isEnabled: false,
  //     cpu: 128,
  //     memory: 512,
  //     desiredCount: 1,
  //     port: 80,
  //   },
  //   autoscaling: {
  //     isEnabled: false,
  //     minCapacity: 1,
  //     maxCapacity: 10,
  //     policies: [
  //       {
  //         type: `memory`,
  //         policyType: 'TargetTrackingScaling',
  //         predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
  //         targetValue: 80,
  //         scaleInCooldown: 30,
  //         scaleOutCooldown: 60,
  //       },
  //       {
  //         type: `cpu`,
  //         policyType: 'TargetTrackingScaling',
  //         predefinedMetricType: 'ECSServiceAverageCPUUtilization',
  //         targetValue: 70,
  //         scaleInCooldown: 30,
  //         scaleOutCooldown: 60,
  //       },
  //     ],
  //   },
  // })

  // NOTE: Initialize new Lambda service called "x
  // const xLambda = new lambdaservice.Service(config, stack, 'x')
  // xLambda.New({
  //   language: lambda.JS,
  //   isFifo: true,
  //   isProd: true,
  //   isPublic: true,
  //   variables: {
  //     url: 'https://httpbin.dev/post',
  //     token: '123456789',
  //   },
  //   archive: new pulumi.asset.FileArchive(
  //     './src/services/lambda/function/app.zip'
  //   ),
  // })

  // const name = 'string'
  // const codepipelineRole = iam.NewCodePipelineRole(name)
  // const codebuildRole = iam.NewCodeBuildRole(name)
  // const pipeline = codepipeline.NewPipeline(
  //   name,
  //   codepipelineRole,
  //   codebuildRole,
  //   {
  //     region: 'ap-southeast-1',
  //     source: 'github',
  //     deploymentTarget: 'ecs',
  //     github: {
  //       username: '',
  //       repo: '',
  //       token: '',
  //     },
  //   }
  // )

  // codepipeline.NewPipelineWebhook(name, pipeline, 'github', {
  //   github: {
  //     token: '',
  //   },
  // })
}

main()
