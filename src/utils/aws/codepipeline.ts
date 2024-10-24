import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'

import * as s3 from './s3'

const StageSourceCodeStarV1 = (
  region: string,
  teamName: string,
  repoName: string,
  codestarConnection: string
): pulumi.Input<aws.types.input.codepipeline.PipelineStage> => ({
  name: 'Source',
  actions: [
    {
      name: 'Source',
      category: 'Source',
      owner: 'AWS',
      provider: 'CodeStarSourceConnection',
      version: '1',
      outputArtifacts: ['SourceArtifact'],
      region: region,
      configuration: {
        ConnectionArn: codestarConnection,
        FullRepositoryId: `${teamName}/${repoName}`,
        OutputArtifactFormat: 'CODEBUILD_CLONE_REF',
      },
      runOrder: 1,
    },
  ],
})

const StageSourceCodeStarV2 = (
  region: string,
  teamName: string,
  repoName: string,
  codestarConnection: string
): pulumi.Input<aws.types.input.codepipeline.PipelineStage> => ({
  name: 'Source',
  actions: [
    {
      name: 'Source',
      category: 'Source',
      owner: 'AWS',
      provider: 'CodeStarSourceConnection',
      version: '1',
      outputArtifacts: ['SourceArtifact'],
      region: region,
      configuration: {
        ConnectionArn: codestarConnection,
        FullRepositoryId: `${teamName}/${repoName}`,
        OutputArtifactFormat: 'CODEBUILD_CLONE_REF',
        DetectChanges: 'false',
      },
      runOrder: 1,
    },
  ],
})

const StageSourceGithub = (
  region: string,
  ghUsername: string,
  ghRepo: string,
  oAuthToken: string
): pulumi.Input<aws.types.input.codepipeline.PipelineStage> => ({
  name: 'Source',
  actions: [
    {
      name: 'Source',
      category: 'Source',
      owner: 'AWS',
      provider: 'GitHub',
      version: '1',
      outputArtifacts: ['SourceArtifact'],
      region: region,
      configuration: {
        Owner: ghUsername,
        Repo: ghRepo,
        OAuthToken: oAuthToken,
      },
      runOrder: 1,
    },
  ],
})

const PipelineV2Trigger = (
  providerType: string,
  gitTags: Array<string>
): pulumi.Input<Array<aws.types.input.codepipeline.PipelineTrigger>> => [
  {
    providerType: providerType,
    gitConfiguration: {
      sourceActionName: 'Source',
      pushes: [
        {
          tags: {
            includes: gitTags,
          },
        },
      ],
    },
  },
]

const StageCodeBuild = (
  project: aws.codebuild.Project,
  region: string
): pulumi.Input<aws.types.input.codepipeline.PipelineStage> =>
  project.name.apply(name => ({
    name: 'Build',
    actions: [
      {
        name: 'Build',
        category: 'Build',
        owner: 'AWS',
        provider: 'CodeBuild',
        version: '1',
        inputArtifacts: ['SourceArtifact'],
        outputArtifacts: ['BuildArtifact'],
        runOrder: 1,
        region: region,
        configuration: {
          ProjectName: name,
        },
      },
    ],
  }))

const StageDeployECS = (
  name: string,
  region: string
): pulumi.Input<aws.types.input.codepipeline.PipelineStage> => ({
  name: 'Deploy',
  actions: [
    {
      name: 'Deploy',
      category: 'Deploy',
      owner: 'AWS',
      provider: 'ECS',
      version: '1',
      runOrder: 1,
      inputArtifacts: ['BuildArtifact'],
      region: region,
      configuration: {
        ClusterName: `${name}-cluster`,
        ServiceName: `${name}-service`,
        FileName: 'imagedefinitions.json',
      },
    },
  ],
})

const NewCodeBuildProject = (
  name: string,
  codebuildRole: aws.iam.Role,
  args?: aws.codebuild.ProjectArgs
) => {
  return new aws.codebuild.Project(name, {
    ...args,
    description: name,
    serviceRole: codebuildRole.arn,
    artifacts: {
      type: 'CODEPIPELINE',
    },
    environment: {
      type: 'LINUX_CONTAINER',
      computeType: 'BUILD_GENERAL1_SMALL',
      image: 'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
      imagePullCredentialsType: 'CODEBUILD',
      privilegedMode: true,
    },
    source: {
      type: 'CODEPIPELINE',
      buildspec: 'buildspec.yml',
      gitCloneDepth: 0,
    },
  })
}

const NewPipelineV2 = (
  name: string,
  codepipelineRole: aws.iam.Role,
  codepipelineType: string,
  codebuildRole: aws.iam.Role,
  opts: {
    region: string
    source: string
    deploymentTarget: string
    bitbucket?: {
      codestarConnection: string
      teamName: string
      repoName: string
    }
    github?: {
      username: string
      repo: string
      token: string
    }
    tagPatterns?: Array<string>
  }
) => {
  const tags = {
    project: name,
  }

  const codepipelineArtifactBucket = s3.NewBucket(`${name}-artifact-bucket`)
  const codebuildProject = NewCodeBuildProject(name, codebuildRole)

  const stages: Array<
    pulumi.Input<aws.types.input.codepipeline.PipelineStage>
  > = []

  // NOTE: Add source stage
  if (opts.source === 'codestar') {
    if (!opts.bitbucket) {
      throw new Error('Bitbucket options are required')
    }

    if (codepipelineType !== 'V2') {
      stages.push(
        StageSourceCodeStarV1(
          opts.region,
          opts.bitbucket.teamName,
          opts.bitbucket.repoName,
          opts.bitbucket.codestarConnection
        )
      )
    } else {
      stages.push(
        StageSourceCodeStarV2(
          opts.region,
          opts.bitbucket.teamName,
          opts.bitbucket.repoName,
          opts.bitbucket.codestarConnection
        )
      )
    }
  } else if (opts.source === 'github') {
    if (!opts.github) {
      throw new Error('Github options are required')
    }

    stages.push(
      StageSourceGithub(
        opts.region,
        opts.github.username,
        opts.github.repo,
        opts.github.token
      )
    )
  }

  // NOTE: Add build stage
  stages.push(StageCodeBuild(codebuildProject, opts.region))

  // NOTE: Add deploy stage
  if (opts.deploymentTarget === 'ecs') {
    stages.push(StageDeployECS(name, opts.region))
  }

  const triggers: pulumi.Input<
    Array<aws.types.input.codepipeline.PipelineTrigger>
  > = PipelineV2Trigger('CodeStarSourceConnection', ['release-*'])

  return new aws.codepipeline.Pipeline(name, {
    name: name,
    pipelineType: 'V2',
    executionMode: 'QUEUED',
    roleArn: codepipelineRole.arn,
    stages: stages,
    artifactStores: [
      {
        type: 'S3',
        location: codepipelineArtifactBucket.arn,
      },
    ],
    triggers: triggers,
    tags: tags,
  })
}

export { NewPipelineV2, NewCodeBuildProject }
