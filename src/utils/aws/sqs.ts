import * as aws from '@pulumi/aws'

const getQueueName = (
  queueName: string,
  isDeadLetter: boolean,
  isFifo: boolean
): string => {
  if (isDeadLetter) {
    queueName = `${queueName}-failed`
  }

  if (isFifo) {
    queueName = `${queueName}.fifo`
  }

  return queueName
}

const NewQueue = (
  name: string,
  args: aws.sqs.QueueArgs,
  isDeadLetter: boolean,
  isFifo: boolean
) => {
  const queueName = getQueueName(name, isDeadLetter, isFifo)
  return new aws.sqs.Queue(queueName, {
    ...args,
    name: queueName,
    messageRetentionSeconds: args.messageRetentionSeconds || 345600,
    receiveWaitTimeSeconds: args.receiveWaitTimeSeconds || 20,
    visibilityTimeoutSeconds: args.visibilityTimeoutSeconds || 30,
  })
}

export { NewQueue }
