import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'

import * as iam from '../../utils/iam'
import * as lambda from '../../utils/lambda'
import * as sqs from '../../utils/sqs'

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
}

class Service {
  config: pulumi.Config
  name: string

  constructor(config: pulumi.Config, name: string) {
    this.config = config
    this.name = name
  }

  new(args: NewServiceArgs) {
    const tags = {
      project: this.name,
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
      const deadLetterQueue = sqs.NewQueue(
        this.name,
        deadLetterQueueArgs,
        true,
        args.isFifo,
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

    const queue = sqs.NewQueue(this.name, queueArgs, false, args.isFifo)

    const role = iam.NewLambdaRole(this.name)

    const rolePolicyName = `${this.name}-inline-policy`
    const policyDocument: aws.iam.PolicyDocument = {
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
    iam.NewLambdaRolePolicy(role, rolePolicyName, policyDocument)

    const fn = lambda.NewFunction(
      this.name,
      args.language,
      args.variables,
      role,
    )

    const batchSize = 1
    lambda.NewEventSourceMapping(this.name, queue, fn, batchSize)

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
