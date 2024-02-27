import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import * as awsx from '@pulumi/awsx'

const NewSecretsManager = (
  name: string,
  args?: aws.secretsmanager.SecretArgs | undefined,
) => {
  return new aws.secretsmanager.Secret(name, {
    name: name,
    ...args,
  })
}

const NewSecretsManagerSecretVersion = (
  name: string,
  args: aws.secretsmanager.SecretVersionArgs,
) => {
  return new aws.secretsmanager.SecretVersion(name, {
    ...args,
  })
}

const PopulateSecrets = async (
  secretsManager: aws.secretsmanager.Secret,
  secretsVariables: Array<string>,
) => {
  const secrets:
    | pulumi.Input<awsx.types.input.ecs.TaskDefinitionSecretArgs>[]
    | undefined = []

  secretsVariables.forEach(variable => {
    secrets.push({
      valueFrom: pulumi.interpolate`${secretsManager.arn}:${variable}::`,
      name: variable,
    })
  })

  return secrets
}

export { NewSecretsManager, NewSecretsManagerSecretVersion, PopulateSecrets }
