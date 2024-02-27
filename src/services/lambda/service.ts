import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'

import * as iam from '../../utils/aws/iam'
import * as lambda from '../../utils/aws/lambda'
import * as sqs from '../../utils/aws/sqs'
import * as iampolicydocument from '../../utils/aws/iampolicydocument'

const AN_HOUR = 3600
const FOUR_DAYS = 345600
const SEVEN_DAYS = 604800

type NewServiceArgs = {
  language: string
  isFifo: boolean
  isProd: boolean
  isPublic: boolean
  variables: {
    url: string
    token: string
  }
  archive: pulumi.asset.FileArchive
}

class Service {
  config: pulumi.Config
  stack: string
  name: string
  serviceName: string

  constructor(config: pulumi.Config, stack: string, name: string) {
    this.config = config
    this.stack = stack
    this.name = name
    this.serviceName = `${stack}-${name}`
  }

  New = async (args: NewServiceArgs) => {
    const tags = {
      project: this.serviceName,
    }

    if (!lambda.ALLOWED_LANGUAGES.includes(args.language || '')) {
      throw new Error('language is required')
    }

    let redrivePolicy: pulumi.Input<string> | undefined
    if (args.isProd) {
      const deadLetterQueueArgs: aws.sqs.QueueArgs = {
        fifoQueue: args.isFifo,
        messageRetentionSeconds: SEVEN_DAYS,
        visibilityTimeoutSeconds: AN_HOUR,
        tags: tags,
      }
      const isDeadLetter = true
      const deadLetterQueue = sqs.NewQueue(
        this.serviceName,
        deadLetterQueueArgs,
        isDeadLetter,
        args.isFifo
      )

      const maxReceiveCount = 5
      redrivePolicy = deadLetterQueue.arn.apply(arn => {
        return JSON.stringify({
          deadLetterTargetArn: arn,
          maxReceiveCount: maxReceiveCount,
        })
      })
    }

    const queueArgs: aws.sqs.QueueArgs = {
      fifoQueue: args.isFifo,
      messageRetentionSeconds: FOUR_DAYS,
      visibilityTimeoutSeconds: AN_HOUR,
      tags: tags,
    }

    if (args.isProd && redrivePolicy) {
      queueArgs.redrivePolicy = redrivePolicy
    }

    const isDeadLetter = false
    const queue = sqs.NewQueue(
      this.serviceName,
      queueArgs,
      isDeadLetter,
      args.isFifo
    )

    const role = iam.NewLambdaRole(this.serviceName)

    const rolePolicyName = `${this.serviceName}-inline-policy`
    const policyDocument = iampolicydocument.LambdaTriggerPolicyDocument()
    iam.NewLambdaRolePolicy(rolePolicyName, role, policyDocument)

    const fn = lambda.NewFunction(
      this.serviceName,
      args.language,
      args.variables,
      role,
      args.archive
    )

    const batchSize = 1
    lambda.NewEventSourceMapping(this.serviceName, queue, fn, batchSize)

    let fnUrl
    if (args.isPublic) {
      fnUrl = lambda.NewFunctionUrl(fn)
    }

    const result: {
      queue: aws.sqs.Queue
      functionName: aws.lambda.Function
      functionUrl?: aws.lambda.FunctionUrl
    } = {
      queue: queue,
      functionName: fn,
    }

    if (args.isPublic) {
      result.functionUrl = fnUrl
    }

    return result
  }
}

export { Service }
