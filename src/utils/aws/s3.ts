import * as aws from '@pulumi/aws'

const NewBucket = (
  name: string,
  args?: aws.s3.BucketV2Args
): aws.s3.BucketV2 => {
  return new aws.s3.BucketV2(name, args)
}

const SetObjectOwnership = (
  name: string,
  bucket: aws.s3.Bucket,
  objectOwnership: string
) => {
  return new aws.s3.BucketOwnershipControls(name, {
    bucket: bucket.id,
    rule: {
      objectOwnership: objectOwnership,
    },
  })
}

export { NewBucket, SetObjectOwnership }
