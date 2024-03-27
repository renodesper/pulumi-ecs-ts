import * as aws from '@pulumi/aws'

const AssumeRoleEcsPolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'ecs-tasks.amazonaws.com',
        },
      },
    ],
  }
}

const AssumeRoleCodePipelinePolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'codepipeline.amazonaws.com',
        },
      },
    ],
  }
}

const AssumeRoleCodeBuildPolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'codebuild.amazonaws.com',
        },
      },
    ],
  }
}

const AssumeRoleLambdaPolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }
}

const BitbucketCodestarConnectionPolicyDocument = (
  arn: string
): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'codestar-connections:UseConnection',
        Effect: 'Allow',
        Resource: arn, // NOTE: arn:aws:codestar-connections:ap-southeast-1:257034807569:connection/xxx
      },
    ],
  }
}

const CodeBuildPolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: ['codebuild:StopBuild'],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: [
          'ec2:CreateNetworkInterface',
          'ec2:DescribeDhcpOptions',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeVpcs',
          'ec2:CreateNetworkInterfacePermission',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:CompleteLayerUpload',
          'ecr:GetAuthorizationToken',
          'ecr:InitiateLayerUpload',
          'ecr:PutImage',
          'ecr:UploadLayerPart',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: [
          'ecr-public:BatchCheckLayerAvailability',
          'ecr-public:CompleteLayerUpload',
          'ecr-public:GetAuthorizationToken',
          'ecr-public:InitiateLayerUpload',
          'ecr-public:PutImage',
          'ecr-public:UploadLayerPart',
          'ecr-public:GetDownloadUrlForLayer',
          'ecr-public:BatchGetImage',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: [
          's3:GetBucketAcl',
          's3:GetBucketLocation',
          's3:GetObject',
          's3:GetObjectVersion',
          's3:ListBucket',
          's3:PutObject',
        ],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: ['ssm:GetParameters'],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: ['sts:GetServiceBearerToken'],
        Effect: 'Allow',
        Resource: '*',
      },
      {
        Action: ['secretsmanager:GetSecretValue'],
        Effect: 'Allow',
        Resource: '*',
      },
    ],
  }
}

const CodePipelinePolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: ['iam:PassRole'],
        Resource: '*',
        Effect: 'Allow',
        Condition: {
          StringEqualsIfExists: {
            'iam:PassedToService': [
              'cloudformation.amazonaws.com',
              'elasticbeanstalk.amazonaws.com',
              'ec2.amazonaws.com',
              'ecs-tasks.amazonaws.com',
            ],
          },
        },
      },
      {
        Action: [
          'codecommit:CancelUploadArchive',
          'codecommit:GetBranch',
          'codecommit:GetCommit',
          'codecommit:GetRepository',
          'codecommit:GetUploadArchiveStatus',
          'codecommit:UploadArchive',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: [
          'codedeploy:CreateDeployment',
          'codedeploy:GetApplication',
          'codedeploy:GetApplicationRevision',
          'codedeploy:GetDeployment',
          'codedeploy:GetDeploymentConfig',
          'codedeploy:RegisterApplicationRevision',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: ['codestar-connections:UseConnection'],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: [
          'elasticbeanstalk:*',
          'ec2:*',
          'elasticloadbalancing:*',
          'autoscaling:*',
          'cloudwatch:*',
          's3:*',
          'sns:*',
          'cloudformation:*',
          'rds:*',
          'sqs:*',
          'ecs:*',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: ['lambda:InvokeFunction', 'lambda:ListFunctions'],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: [
          'opsworks:CreateDeployment',
          'opsworks:DescribeApps',
          'opsworks:DescribeCommands',
          'opsworks:DescribeDeployments',
          'opsworks:DescribeInstances',
          'opsworks:DescribeStacks',
          'opsworks:UpdateApp',
          'opsworks:UpdateStack',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: [
          'cloudformation:CreateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:UpdateStack',
          'cloudformation:CreateChangeSet',
          'cloudformation:DeleteChangeSet',
          'cloudformation:DescribeChangeSet',
          'cloudformation:ExecuteChangeSet',
          'cloudformation:SetStackPolicy',
          'cloudformation:ValidateTemplate',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Action: [
          'codebuild:BatchGetBuilds',
          'codebuild:StartBuild',
          'codebuild:BatchGetBuildBatches',
          'codebuild:StartBuildBatch',
        ],
        Resource: '*',
        Effect: 'Allow',
      },
      {
        Effect: 'Allow',
        Action: [
          'devicefarm:ListProjects',
          'devicefarm:ListDevicePools',
          'devicefarm:GetRun',
          'devicefarm:GetUpload',
          'devicefarm:CreateUpload',
          'devicefarm:ScheduleRun',
        ],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: [
          'servicecatalog:ListProvisioningArtifacts',
          'servicecatalog:CreateProvisioningArtifact',
          'servicecatalog:DescribeProvisioningArtifact',
          'servicecatalog:DeleteProvisioningArtifact',
          'servicecatalog:UpdateProduct',
        ],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: ['cloudformation:ValidateTemplate'],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: ['ecr:DescribeImages'],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: [
          'states:DescribeExecution',
          'states:DescribeStateMachine',
          'states:StartExecution',
        ],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: [
          'appconfig:StartDeployment',
          'appconfig:StopDeployment',
          'appconfig:GetDeployment',
        ],
        Resource: '*',
      },
    ],
  }
}

const GetSecretsManagerPolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Action: ['secretsmanager:GetSecretValue'],
        Effect: 'Allow',
        Resource: '*',
      },
    ],
  }
}

const LambdaTriggerPolicyDocument = (): aws.iam.PolicyDocument => {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: [
          'sqs:GetQueueAttributes',
          'sqs:ReceiveMessage',
          'sqs:DeleteMessage',
        ],
        Resource: '*',
      },
    ],
  }
}

export {
  AssumeRoleCodeBuildPolicyDocument,
  AssumeRoleCodePipelinePolicyDocument,
  AssumeRoleEcsPolicyDocument,
  AssumeRoleLambdaPolicyDocument,
  BitbucketCodestarConnectionPolicyDocument,
  CodeBuildPolicyDocument,
  CodePipelinePolicyDocument,
  GetSecretsManagerPolicyDocument,
  LambdaTriggerPolicyDocument,
}
