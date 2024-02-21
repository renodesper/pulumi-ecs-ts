import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

import * as loadbalancer from '../../utils/loadbalancer';
import * as ecs from '../../utils/ecs';

interface NewServiceArgs {
  loadBalancer: {
    targetGroupPort: number;
    isHttpsEnabled: boolean;
    securityGroup: aws.ec2.SecurityGroup;
  };
  ecs: {
    cpu: number;
    memory: number;
    desiredCount: number;
    port: number;
  };
  autoscaling?: {
    minCapacity: number;
    maxCapacity: number;
    policies: Array<{
      type: string;
      policyType: string;
      predefinedMetricType: string;
      targetValue: number;
      scaleInCooldown: number;
      scaleOutCooldown: number;
    }>;
  };
}

class Service {
  config: pulumi.Config;
  name: string;
  vpc: aws.ec2.GetVpcResult;
  subnets: aws.ec2.GetSubnetsResult;
  loadBalancerName: string;
  targetGroupName: string;
  ecrRepositoryName: string;
  ecrImageName: string;
  ecsClusterName: string;
  ecsServiceName: string;
  autoscalingTargetName?: string;

  constructor(
    config: pulumi.Config,
    name: string,
    vpc: aws.ec2.GetVpcResult,
    subnets: aws.ec2.GetSubnetsResult,
  ) {
    this.config = config;
    this.name = name;
    this.vpc = vpc;
    this.subnets = subnets;
    this.loadBalancerName = `${name}-lb`;
    this.targetGroupName = `${name}-tg`;
    this.ecrRepositoryName = `${name}-repo`;
    this.ecrImageName = `${name}-img`;
    this.ecsClusterName = `${name}-cluster`;
    this.ecsServiceName = `${name}-svc`;
    this.autoscalingTargetName = `${name}-autoscaling`;
  }

  new(args: NewServiceArgs) {
    const tags = {
      project: this.name,
    };

    const loadBalancer = loadbalancer.NewLoadBalancer(
      this.loadBalancerName,
      this.subnets,
      args.loadBalancer.securityGroup,
      tags,
    );

    const targetGroup = loadbalancer.NewTargetGroup(
      this.targetGroupName,
      this.vpc,
      args.loadBalancer.targetGroupPort,
      tags,
    );

    const listenerOpts = { targetGroup: targetGroup };
    loadbalancer.NewListeners(
      this.loadBalancerName,
      loadBalancer,
      args.loadBalancer.isHttpsEnabled,
      listenerOpts,
    );

    const ecrRepository = new awsx.ecr.Repository(this.ecrRepositoryName, {
      forceDelete: true,
      tags: tags,
    });
    const ecrImage = new awsx.ecr.Image(this.ecrImageName, {
      repositoryUrl: ecrRepository.url,
      context: './services/ecs/app',
      platform: 'linux/amd64', // NOTE: 'linux/arm64' or 'linux/amd64'
    });

    const ecsCluster = ecs.NewCluster(this.ecsClusterName, tags);

    const containerDefinition = {
      image: ecrImage,
      name: this.name,
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
    };
    const ecsService = ecs.NewFargateService(
      this.ecsServiceName,
      this.subnets,
      ecsCluster,
      args.ecs.desiredCount,
      containerDefinition,
      loadBalancer,
      targetGroup,
      tags,
    );

    if (this.autoscalingTargetName && args.autoscaling) {
      const targetName = this.autoscalingTargetName ?? '';
      const scalingTarget = ecs.NewAutoScalingTarget(
        targetName,
        args.autoscaling.minCapacity,
        args.autoscaling.maxCapacity,
        ecsCluster,
        ecsService,
      );
      args.autoscaling.policies.forEach((policy) => {
        ecs.NewAutoScalingPolicy(
          `${targetName}-${policy.type}`,
          scalingTarget,
          policy.policyType,
          policy.predefinedMetricType,
          policy.targetValue,
          policy.scaleInCooldown,
          policy.scaleOutCooldown,
        );
      });
    }
  }
}

export { Service };
