import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'
import * as docker from '@pulumi/docker'

const NewCluster = (name: string, tags: { [key: string]: string }) => {
  return new aws.ecs.Cluster(name, {
    name: name,
    tags: tags,
  })
}

const NewFargateService = (
  name: string,
  subnets: aws.ec2.GetSubnetsResult,
  cluster: aws.ecs.Cluster,
  desiredCount: number,
  containerDefinition: {
    image: docker.Image
    name: string
    cpu: number
    memory: number
    port: number
    portMappings: Array<{
      containerPort: number
      hostPort: number
    }>
    secrets?:
      | pulumi.Input<awsx.types.input.ecs.TaskDefinitionSecretArgs>[]
      | undefined
  },
  loadBalancer: aws.lb.LoadBalancer,
  targetGroup: aws.lb.TargetGroup,
  tags: {
    project: string
  },
  dependsOn?: pulumi.Resource[]
) => {
  return new awsx.ecs.FargateService(
    name,
    {
      name: name,
      cluster: cluster.arn,
      desiredCount: desiredCount,
      taskDefinitionArgs: {
        family: `${containerDefinition.name}-td`,
        container: {
          image: containerDefinition.image.urn,
          name: containerDefinition.name,
          cpu: containerDefinition.cpu,
          memory: containerDefinition.memory,
          portMappings: containerDefinition.portMappings,
          secrets: containerDefinition.secrets,
          healthCheck: {
            command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
            interval: 10,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
          essential: true,
        },
      },
      loadBalancers: [
        targetGroup.arn.apply(arn => {
          return {
            targetGroupArn: arn,
            containerName: containerDefinition.name,
            containerPort: containerDefinition.port,
          }
        }),
      ],
      networkConfiguration: {
        subnets: subnets.ids,
        securityGroups: [loadBalancer.securityGroups[0]],
        assignPublicIp: true,
      },
      tags: tags,
    },
    {
      dependsOn: dependsOn,
    }
  )
}

const NewAutoScalingTarget = (
  name: string,
  minCapacity: number,
  maxCapacity: number,
  ecsCluster: aws.ecs.Cluster | undefined,
  ecsService: awsx.ecs.FargateService | undefined
) => {
  if (ecsCluster === undefined) {
    throw new Error('ECS Cluster is not defined')
  }
  if (ecsService === undefined) {
    throw new Error('ECS Service is not defined')
  }

  return new aws.appautoscaling.Target(name, {
    serviceNamespace: 'ecs',
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.service.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    minCapacity: minCapacity,
    maxCapacity: maxCapacity,
  })
}

const NewAutoScalingPolicy = (
  name: string,
  scalingTarget: aws.appautoscaling.Target,
  policyType: string,
  predefinedMetricType: string,
  targetValue: number,
  scaleInCooldown: number,
  scaleOutCooldown: number
) => {
  return new aws.appautoscaling.Policy(name, {
    name: name,
    resourceId: scalingTarget.resourceId,
    serviceNamespace: scalingTarget.serviceNamespace,
    scalableDimension: scalingTarget.scalableDimension,
    policyType: policyType,
    targetTrackingScalingPolicyConfiguration: {
      predefinedMetricSpecification: {
        predefinedMetricType: predefinedMetricType,
      },
      targetValue: targetValue,
      scaleInCooldown: scaleInCooldown,
      scaleOutCooldown: scaleOutCooldown,
    },
  })
}

export {
  NewCluster,
  NewFargateService,
  NewAutoScalingTarget,
  NewAutoScalingPolicy,
}
