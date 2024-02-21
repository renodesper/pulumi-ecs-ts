import * as aws from '@pulumi/aws';

const NewQueue = (name: string, args: aws.sqs.QueueArgs) => {
  return new aws.sqs.Queue(name, args);
};

export { NewQueue };
