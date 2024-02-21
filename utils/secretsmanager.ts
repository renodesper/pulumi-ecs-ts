import * as aws from '@pulumi/aws'

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

export { NewSecretsManager, NewSecretsManagerSecretVersion }
