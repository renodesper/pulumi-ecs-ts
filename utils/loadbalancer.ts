import * as aws from '@pulumi/aws';

const NewLoadBalancer = (
  name: string,
  subnets: Promise<aws.ec2.GetSubnetsResult>,
  securityGroup: aws.ec2.SecurityGroup,
  tags: {
    project: string;
  }
) => {
  return new aws.lb.LoadBalancer(name, {
    name: name,
    loadBalancerType: 'application',
    internal: false,
    enableDeletionProtection: false,
    subnets: subnets.then((subnets) => subnets.ids),
    securityGroups: [securityGroup.id],
    tags: tags,
  });
};

const NewTargetGroup = (
  name: string,
  vpc: Promise<aws.ec2.GetVpcResult>,
  targetGroupPort: number,
  tags: {}
) => {
  return new aws.lb.TargetGroup(name, {
    name: name,
    targetType: 'ip',
    protocol: 'HTTP',
    port: targetGroupPort, // NOTE: Port on which targets receive traffic
    vpcId: vpc.then((vpc) => vpc.id),
    healthCheck: {
      protocol: 'HTTP',
      port: 'traffic-port',
      path: '/',
      matcher: '200',
      interval: 60,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 2,
    },
    tags: tags,
  });
};

const NewListeners = (
  name: string,
  loadBalancer: aws.lb.LoadBalancer,
  isHttpsEnabled: boolean,
  opts: {
    targetGroup: aws.lb.TargetGroup;
    certificateArn?: string;
  }
) => {
  let listeners: aws.lb.Listener[] = [];

  if (isHttpsEnabled) {
    const httpListener = NewHttpListener(
      `${name}-http`,
      loadBalancer,
      isHttpsEnabled,
      opts
    );
    listeners.push(httpListener);

    const httpsListener = NewHttpsListener(
      `${name}-https`,
      loadBalancer,
      opts.targetGroup,
      opts.certificateArn
    );
    listeners.push(httpsListener);
  } else {
    const httpListener = NewHttpListener(
      `${name}-http`,
      loadBalancer,
      isHttpsEnabled,
      opts
    );
    listeners.push(httpListener);
  }

  return listeners;
};

const NewHttpListener = (
  name: string,
  loadBalancer: aws.lb.LoadBalancer,
  isHttpsEnabled: boolean,
  opts: {
    targetGroup: aws.lb.TargetGroup;
  }
) => {
  let defaultActions;
  if (isHttpsEnabled) {
    defaultActions = [
      {
        type: 'redirect',
        redirect: {
          protocol: 'HTTPS',
          port: '443',
          statusCode: 'HTTP_301',
        },
      },
    ];
  } else {
    defaultActions = [
      {
        type: 'forward',
        targetGroupArn: opts.targetGroup.arn,
      },
    ];
  }

  return new aws.lb.Listener(name, {
    protocol: 'HTTP',
    port: 80,
    loadBalancerArn: loadBalancer.arn,
    defaultActions: defaultActions,
  });
};

const NewHttpsListener = (
  name: string,
  loadBalancer: aws.lb.LoadBalancer,
  targetGroup: aws.lb.TargetGroup,
  certificateArn: string | undefined
) => {
  return new aws.lb.Listener(name, {
    loadBalancerArn: loadBalancer.arn,
    port: 443,
    protocol: 'HTTPS',
    sslPolicy: 'ELBSecurityPolicy-2016-08',
    certificateArn: certificateArn,
    defaultActions: [
      {
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      },
    ],
  });
};

export { NewLoadBalancer, NewTargetGroup, NewListeners };
