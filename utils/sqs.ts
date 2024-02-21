import * as aws from '@pulumi/aws'

const NewQueue = (
  name: string,
  args: aws.sqs.QueueArgs,
  isDeadLetter: boolean,
  isFifo: boolean,
) => {
  const queueName = getQueueName(name, isDeadLetter, isFifo)
  return new aws.sqs.Queue(queueName, {
    ...args,
    name: queueName,
    // tags: tags, // TODO: add tags
  })
}

const getQueueName = (
  queueName: string,
  isDeadLetter: boolean,
  isFifo: boolean,
): string => {
  if (isDeadLetter) {
    queueName = `${queueName}_failed`
  }

  if (isFifo) {
    queueName = `${queueName}.fifo`
  }

  return queueName
}

export { NewQueue }
