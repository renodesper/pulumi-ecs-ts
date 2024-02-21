import * as aws from '@pulumi/aws';

const NewRole = (name: string, args: aws.iam.RoleArgs) => {
  return new aws.iam.Role(name, args);
};

const NewRolePolicy = (name: string, args: aws.iam.RolePolicyArgs) => {
  return new aws.iam.RolePolicy(name, args);
};

export { NewRole, NewRolePolicy };
