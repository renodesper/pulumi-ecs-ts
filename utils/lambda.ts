import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'

const GO = 'go'
const JS = 'js'
const PYTHON = 'python'
const ALLOWED_LANGUAGES = [GO, JS, PYTHON]

const GO_RUNTIME = 'go1.x'
const JS_RUNTIME = 'nodejs18.x'
const PYTHON_RUNTIME = 'python3.11'

const GO_HANDLER = 'main'
const JS_HANDLER = 'index.handler'
const PYTHON_HANDLER = 'main.handler'

const NewFunction = (
  name: string,
  language: string,
  variables: pulumi.Input<{ [key: string]: pulumi.Input<string> }> | undefined,
  role: aws.iam.Role,
): aws.lambda.Function => {
  const args: {
    name: string
    role: pulumi.Output<string>
    timeout: number
    code: pulumi.asset.FileArchive
    environment: object
    runtime?: string
    handler?: string
  } = {
    name: name,
    role: role.arn,
    timeout: 900,
    code: new pulumi.asset.FileArchive('./services/lambda/function/app.zip'),
    environment: {
      variables: variables,
    },
  }

  switch (language) {
    case GO: {
      args.runtime = GO_RUNTIME
      args.handler = GO_HANDLER
      break
    }
    case JS: {
      args.runtime = JS_RUNTIME
      args.handler = JS_HANDLER
      break
    }
    case PYTHON: {
      args.runtime = PYTHON_RUNTIME
      args.handler = PYTHON_HANDLER
      break
    }
  }

  return new aws.lambda.Function(name, args)
}

const NewFunctionUrl = (fn: aws.lambda.Function) => {
  const functionUrlArgs: aws.lambda.FunctionUrlArgs = {
    functionName: fn.name,
    authorizationType: 'NONE',
    cors: {
      allowMethods: ['POST'],
      allowHeaders: ['content-type'],
      allowOrigins: ['*'],
    },
  }

  const functionUrlName = pulumi.interpolate`${fn.name}-url`

  let functionUrl
  functionUrlName.apply(urlName => {
    functionUrl = new aws.lambda.FunctionUrl(urlName, functionUrlArgs)
  })

  return functionUrl
}

const NewEventSourceMapping = (
  name: string,
  queue: aws.sqs.Queue,
  fn: aws.lambda.Function,
  batchSize: number,
): aws.lambda.EventSourceMapping => {
  const args = {
    eventSourceArn: queue.arn,
    functionName: fn.name,
    batchSize: batchSize,
  }

  return new aws.lambda.EventSourceMapping(name, args)
}

export {
  NewFunction,
  NewFunctionUrl,
  NewEventSourceMapping,
  GO,
  JS,
  PYTHON,
  ALLOWED_LANGUAGES,
}
