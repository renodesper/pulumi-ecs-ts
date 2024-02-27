import * as aws from '@pulumi/aws'

import * as iampolicydocument from '../../utils/aws/iampolicydocument'

const NewRole = (name: string, args: aws.iam.RoleArgs) => {
  return new aws.iam.Role(name, args)
}

const NewRolePolicy = (name: string, args: aws.iam.RolePolicyArgs) => {
  return new aws.iam.RolePolicy(name, args)
}

const NewLambdaRole = (name: string): aws.iam.Role => {
  const roleName = `${name}-lambda-role`
  const policyDocument = iampolicydocument.AssumeRoleLambdaPolicyDocument()
  const args = {
    name: roleName,
    assumeRolePolicy: policyDocument,
    managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
  }

  return NewRole(roleName, args)
}

const NewLambdaRolePolicy = (
  name: string,
  role: aws.iam.Role,
  policyDocument: aws.iam.PolicyDocument
): aws.iam.RolePolicy => {
  const rolePolicy = new aws.iam.RolePolicy(name, {
    name: name,
    role: role.id,
    policy: JSON.stringify(policyDocument),
  })

  return rolePolicy
}

const NewCodePipelineRole = (name: string): aws.iam.Role => {
  const roleName = `${name}-codepipeline-role`
  const policyDocument =
    iampolicydocument.AssumeRoleCodePipelinePolicyDocument()
  const args = {
    name: roleName,
    assumeRolePolicy: policyDocument,
  }

  return NewRole(roleName, args)
}

const NewCodeBuildRole = (name: string): aws.iam.Role => {
  const roleName = `${name}-codebuild-role`
  const policyDocument = iampolicydocument.AssumeRoleCodeBuildPolicyDocument()
  const args = {
    name: roleName,
    assumeRolePolicy: policyDocument,
  }

  return NewRole(roleName, args)
}

const NewCodeBuildRolePolicyAttachments = (
  name: string,
  role: aws.iam.Role,
  arn: string
) => {
  // NOTE: Attach Bitbucket Policy
  const bitbucketPolicyDocument =
    iampolicydocument.BitbucketCodestarConnectionPolicyDocument(arn)
  const bitbucketPolicy = new aws.iam.Policy(`${name}-bitbucket-policy`, {
    description: `${name}-bitbucket-policy`,
    policy: bitbucketPolicyDocument,
  })
  new aws.iam.RolePolicyAttachment(`${name}-bitbucket-attachment`, {
    role: role.name,
    policyArn: bitbucketPolicy.arn,
  })

  // NOTE: Attach CodeBuild Policy
  const codebuildPolicyDocument = iampolicydocument.CodeBuildPolicyDocument()
  const codebuildPolicy = new aws.iam.Policy(`${name}-codebuild-policy`, {
    description: `${name}-codebuild-policy`,
    policy: codebuildPolicyDocument,
  })
  new aws.iam.RolePolicyAttachment(`${name}-codebuild-attachment`, {
    role: role.name,
    policyArn: codebuildPolicy.arn,
  })
}

export {
  NewRole,
  NewRolePolicy,
  NewLambdaRole,
  NewLambdaRolePolicy,
  NewCodePipelineRole,
  NewCodeBuildRole,
  NewCodeBuildRolePolicyAttachments,
}
