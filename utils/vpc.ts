import * as aws from '@pulumi/aws';

const GetDefaultVpc = () => {
  return aws.ec2.getVpc({ default: true });
};

const GetDefaultSubnets = (vpc: Promise<aws.ec2.GetVpcResult>) => {
  return vpc.then((vpc) =>
    aws.ec2.getSubnets({
      filters: [
        {
          name: 'vpc-id',
          values: [vpc.id],
        },
      ],
    })
  );
};

export { GetDefaultVpc, GetDefaultSubnets };
