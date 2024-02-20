import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

import {
  NewLoadBalancer,
  NewTargetGroup,
  NewListeners,
} from '../utils/loadbalancer';
import {
  NewEcsCluster,
  NewFargateService,
  NewAutoScalingTarget,
  NewAutoScalingPolicy,
} from '../utils/ecs';

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

class EcsService {
  config: pulumi.Config;
  name: string;
  vpc: Promise<aws.ec2.GetVpcResult>;
  subnets: Promise<aws.ec2.GetSubnetsResult>;
  loadBalancer: {
    loadBalancerName: string;
    targetGroupName: string;
  };
  ecr: {
    repositoryName: string;
    imageName: string;
  };
  ecs: {
    clusterName: string;
    serviceName: string;
  };
  autoscaling?: {
    targetName: string;
  };

  constructor(
    config: pulumi.Config,
    name: string,
    vpc: Promise<aws.ec2.GetVpcResult>,
    subnets: Promise<aws.ec2.GetSubnetsResult>
  ) {
    this.config = config;
    this.name = name;
    this.vpc = vpc;
    this.subnets = subnets;
    this.loadBalancer = {
      loadBalancerName: `${name}-lb`,
      targetGroupName: `${name}-tg`,
    };
    this.ecr = {
      repositoryName: `${name}-repo`,
      imageName: `${name}-img`,
    };
    this.ecs = {
      clusterName: `${name}-cluster`,
      serviceName: `${name}-svc`,
    };
    this.autoscaling = {
      targetName: `${name}-autoscaling`,
    };
  }

  new(args: NewServiceArgs) {
    const tags = {
      project: this.name,
    };

    const loadBalancer = NewLoadBalancer(
      this.loadBalancer.loadBalancerName,
      this.subnets,
      args.loadBalancer.securityGroup,
      tags
    );

    const targetGroup = NewTargetGroup(
      this.loadBalancer.targetGroupName,
      this.vpc,
      args.loadBalancer.targetGroupPort,
      tags
    );

    const listenerOpts = { targetGroup: targetGroup };
    NewListeners(
      this.loadBalancer.loadBalancerName,
      loadBalancer,
      args.loadBalancer.isHttpsEnabled,
      listenerOpts
    );

    const ecrRepository = new awsx.ecr.Repository(this.ecr.repositoryName, {
      forceDelete: true,
      tags: tags,
    });
    const ecrImage = new awsx.ecr.Image(this.ecr.imageName, {
      repositoryUrl: ecrRepository.url,
      context: './app',
      platform: 'linux/amd64', // NOTE: 'linux/arm64' or 'linux/amd64'
    });

    const ecsCluster = NewEcsCluster(this.ecs.clusterName, tags);

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
    const ecsService = NewFargateService(
      this.ecs.serviceName,
      this.subnets,
      ecsCluster,
      args.ecs.desiredCount,
      containerDefinition,
      loadBalancer,
      targetGroup,
      tags
    );

    if (this.autoscaling && args.autoscaling) {
      const targetName = this.autoscaling.targetName ?? '';
      const scalingTarget = NewAutoScalingTarget(
        targetName,
        args.autoscaling.minCapacity,
        args.autoscaling.maxCapacity,
        ecsCluster,
        ecsService
      );
      args.autoscaling.policies.forEach((policy) => {
        NewAutoScalingPolicy(
          `${targetName}-${policy.type}`,
          scalingTarget,
          policy.policyType,
          policy.predefinedMetricType,
          policy.targetValue,
          policy.scaleInCooldown,
          policy.scaleOutCooldown
        );
      });
    }
  }
}

export { EcsService };
