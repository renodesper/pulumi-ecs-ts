import * as aws from '@pulumi/aws'
import * as docker from '@pulumi/docker'

const NewRepository = (
  name: string,
  args?: aws.ecr.RepositoryArgs | undefined,
) => {
  return new aws.ecr.Repository(name, args)
}

const NewImage = (name: string, context: string, repo: aws.ecr.Repository) => {
  return new docker.Image(
    `${name}-container`,
    {
      imageName: repo.repositoryUrl,
      build: {
        context: context,
        platform: 'linux/amd64',
      },
      registry: {
        server: repo.repositoryUrl,
        username: aws.ecr.getAuthorizationToken().then(token => token.userName),
        password: aws.ecr.getAuthorizationToken().then(token => token.password),
      },
    },
    { dependsOn: [repo] },
  )
}

export { NewRepository, NewImage }
