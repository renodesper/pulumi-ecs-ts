import * as aws from '@pulumi/aws'

const NewSecurityGroup = (
  name: string,
  ingress: Array<{
    fromPort: number
    toPort: number
    protocol: string
    cidrBlocks?: Array<string>
    securityGroups?: any
  }>,
  egress: Array<{
    fromPort: number
    toPort: number
    protocol: string
    cidrBlocks?: Array<string>
    securityGroups?: Array<string>
  }>,
  description?: string,
) => {
  return new aws.ec2.SecurityGroup(name, {
    name: name,
    ingress: ingress,
    egress: egress,
    description: description,
  })
}

const NewDefaultSecurityGroup = (securityGroupId?: string) => {
  if (securityGroupId) {
    return aws.ec2.SecurityGroup.get('default', securityGroupId)
  }

  const ingress = [
    {
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'], // Allow traffic from any IP
    },
    {
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'], // Allow traffic from any IP
    },
  ]
  const egress = [
    {
      fromPort: 0, // All ports
      toPort: 0,
      protocol: '-1', // All protocols
      cidrBlocks: ['0.0.0.0/0'], // Allow traffic to any IP
    },
  ]
  const description = 'Default security group for load balancer'
  return NewSecurityGroup(
    'default-load-balancer-sg',
    ingress,
    egress,
    description,
  )
}

// TODO: Add security group for ECS instances (not working)
const NewEcsSecurityGroup = (
  vpc: Promise<aws.ec2.GetVpcResult>,
  securityGroup: aws.ec2.SecurityGroup,
) => {
  const ingress = [
    {
      fromPort: 0,
      toPort: 0,
      protocol: '-1', // All protocols
      securityGroups: [securityGroup.id], // Allow traffic in from the load balancer security group
    },
    {
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      securityGroups: [vpc.then(vpc => vpc.cidrBlock)], // Allow traffic in from the same VPC
    },
  ]
  const egress = [
    {
      fromPort: 0, // All ports
      toPort: 0,
      protocol: '-1', // All protocols
      cidrBlocks: ['0.0.0.0/0'], // Allow traffic to any IP
    },
  ]
  const description = 'Default security group for ecs instances'
  return NewSecurityGroup('default-ecs', ingress, egress, description)
}

export { NewSecurityGroup, NewDefaultSecurityGroup, NewEcsSecurityGroup }
