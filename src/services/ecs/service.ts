import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

import * as loadbalancer from '../../utils/aws/loadbalancer'
import * as ecr from '../../utils/aws/ecr'
import * as ecs from '../../utils/aws/ecs'
import {
  NewSecretsManager,
  PopulateSecrets,
} from '../../utils/aws/secretsmanager'

type NewServiceArgs = {
  loadBalancer: {
    targetGroupPort: number
    isHttpsEnabled: boolean
    securityGroup: aws.ec2.SecurityGroup
  }
  ecr: {
    imagePath: string
  }
  ecs: {
    isEnabled: boolean
    cpu: number
    memory: number
    desiredCount: number
    port: number
  }
  secretsManager?: {
    isEnabled: boolean
    variables: Array<string>
  }
  autoscaling?: {
    isEnabled: boolean
    minCapacity: number
    maxCapacity: number
    policies: Array<{
      type: string
      policyType: string
      predefinedMetricType: string
      targetValue: number
      scaleInCooldown: number
      scaleOutCooldown: number
    }>
  }
}

class Service {
  config: pulumi.Config
  stack: string
  name: string
  serviceName: string
  vpc: aws.ec2.GetVpcResult
  subnets: aws.ec2.GetSubnetsResult
  loadBalancerName: string
  targetGroupName: string
  ecrRepositoryName: string
  ecrImageName: string
  ecsClusterName: string
  ecsServiceName: string
  autoscalingTargetName?: string

  constructor(
    config: pulumi.Config,
    stack: string,
    name: string,
    vpc: aws.ec2.GetVpcResult,
    subnets: aws.ec2.GetSubnetsResult
  ) {
    this.config = config
    this.stack = stack
    this.name = name
    this.serviceName = `${stack}-${name}`
    this.vpc = vpc
    this.subnets = subnets
    this.loadBalancerName = `${name}-lb`
    this.targetGroupName = `${name}-tg`
    this.ecrRepositoryName = `${name}-repo`
    this.ecrImageName = `${name}-img`
    this.ecsClusterName = `${name}-cluster`
    this.ecsServiceName = `${name}-svc`
    this.autoscalingTargetName = `${name}-autoscaling`
  }

  New = async (args: NewServiceArgs) => {
    const tags = {
      project: this.serviceName,
    }

    const loadBalancer = loadbalancer.NewLoadBalancer(
      this.loadBalancerName,
      this.subnets,
      args.loadBalancer.securityGroup,
      tags
    )

    const targetGroup = loadbalancer.NewTargetGroup(
      this.targetGroupName,
      this.vpc,
      args.loadBalancer.targetGroupPort,
      tags
    )

    const listenerOpts = { targetGroup: targetGroup }
    const listeners = loadbalancer.NewListeners(
      this.loadBalancerName,
      loadBalancer,
      args.loadBalancer.isHttpsEnabled,
      listenerOpts
    )

    let secrets:
      | pulumi.Input<awsx.types.input.ecs.TaskDefinitionSecretArgs>[]
      | undefined
    if (args.secretsManager?.isEnabled) {
      const secretsMan = NewSecretsManager(`${this.stack}/${this.name}`, {
        tags: tags,
      })
      if (args.secretsManager.variables.length > 0) {
        secrets = await PopulateSecrets(
          secretsMan,
          args.secretsManager.variables
        )
      }
    }

    let ecsCluster
    let ecsService
    if (args.ecs.isEnabled) {
      const ecrRepository = ecr.NewRepository(this.ecrRepositoryName, {
        name: this.ecrRepositoryName,
        forceDelete: true,
        tags: tags,
      })

      const ecrImage = ecr.NewImage(
        this.serviceName,
        args.ecr.imagePath,
        ecrRepository
      )

      ecsCluster = ecs.NewCluster(this.ecsClusterName, tags)

      // NOTE: If we need to put secrets in the environment variables, make sure to add the secrets on the dashboard first before deploying the service
      const containerDefinition = {
        image: ecrImage,
        name: this.serviceName,
        cpu: args.ecs.cpu,
        memory: args.ecs.memory,
        port: args.ecs.port,
        portMappings: [
          {
            containerPort: 80,
            hostPort: 80,
          },
          {
            containerPort: 443,
            hostPort: 443,
          },
        ],
        secrets: secrets,
      }
      ecsService = ecs.NewFargateService(
        this.ecsServiceName,
        this.subnets,
        ecsCluster,
        args.ecs.desiredCount,
        containerDefinition,
        loadBalancer,
        targetGroup,
        tags,
        [loadBalancer, targetGroup, ...listeners]
      )
    }

    if (args.ecs.isEnabled && args.autoscaling?.isEnabled) {
      const targetName = this.autoscalingTargetName ?? ''
      const scalingTarget = ecs.NewAutoScalingTarget(
        targetName,
        args.autoscaling.minCapacity,
        args.autoscaling.maxCapacity,
        ecsCluster,
        ecsService
      )
      args.autoscaling.policies.forEach(policy => {
        ecs.NewAutoScalingPolicy(
          `${targetName}-${policy.type}`,
          scalingTarget,
          policy.policyType,
          policy.predefinedMetricType,
          policy.targetValue,
          policy.scaleInCooldown,
          policy.scaleOutCooldown
        )
      })
    }
  }
}

export { Service }
