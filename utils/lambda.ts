import * as aws from '@pulumi/aws';

const NewFunction = (name: string, args: aws.lambda.FunctionArgs) => {
  return new aws.lambda.Function(name, args);
};

const NewFunctionUrl = (name: string, args: aws.lambda.FunctionUrlArgs) => {
  return new aws.lambda.FunctionUrl(name, args);
};

const NewEventSourceMapping = (
  name: string,
  args: aws.lambda.EventSourceMappingArgs
) => {
  return new aws.lambda.EventSourceMapping(name, args);
};

export { NewFunction, NewFunctionUrl, NewEventSourceMapping };
