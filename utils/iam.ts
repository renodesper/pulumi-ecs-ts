import * as aws from '@pulumi/aws'

const NewRole = (name: string, args: aws.iam.RoleArgs) => {
  return new aws.iam.Role(name, args)
}

const NewRolePolicy = (name: string, args: aws.iam.RolePolicyArgs) => {
  return new aws.iam.RolePolicy(name, args)
}

const NewLambdaRole = (name: string): aws.iam.Role => {
  const assumeRolePolicy: aws.iam.PolicyDocument = {
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

  const roleName = `${name}-role`
  const args = {
    name: roleName,
    assumeRolePolicy: assumeRolePolicy,
    managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
  }

  return NewRole(roleName, args)
}

const NewLambdaRolePolicy = (
  role: aws.iam.Role,
  rolePolicyName: string,
  policyDocument: aws.iam.PolicyDocument,
): aws.iam.RolePolicy => {
  const rolePolicy = new aws.iam.RolePolicy(rolePolicyName, {
    name: rolePolicyName,
    role: role.id,
    policy: JSON.stringify(policyDocument),
  })

  return rolePolicy
}

export { NewRole, NewRolePolicy, NewLambdaRole, NewLambdaRolePolicy }
