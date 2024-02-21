import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

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
    image: awsx.ecr.Image
    name: string
    cpu: number
    memory: number
    port: number
    portMappings: Array<{
      containerPort: number
      hostPort: number
    }>
  },
  loadBalancer: aws.lb.LoadBalancer,
  targetGroup: aws.lb.TargetGroup,
  tags: {
    project: string
  }
) => {
  return new awsx.ecs.FargateService(name, {
    name: name,
    cluster: cluster.arn,
    desiredCount: desiredCount,
    taskDefinitionArgs: {
      family: `${containerDefinition.name}-td`,
      container: {
        image: containerDefinition.image.imageUri,
        name: containerDefinition.name,
        cpu: containerDefinition.cpu,
        memory: containerDefinition.memory,
        portMappings: containerDefinition.portMappings,
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
  })
}

const NewAutoScalingTarget = (
  name: string,
  minCapacity: number,
  maxCapacity: number,
  ecsCluster: aws.ecs.Cluster,
  ecsService: awsx.ecs.FargateService
) => {
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
