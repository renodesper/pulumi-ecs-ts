import * as pulumi from '@pulumi/pulumi'

import * as iam from './src/utils/aws/iam'
import * as lambda from './src/utils/aws/lambda'
import * as securitygroup from './src/utils/aws/securitygroup'
import * as vpc from './src/utils/aws/vpc'
import * as ecsservice from './src/services/ecs/service'
import * as lambdaservice from './src/services/lambda/service'

const main = async () => {
  const config = new pulumi.Config()
  const stack = pulumi.getStack()

  // const defaultVpc = await vpc.GetDefaultVpc()
  // const defaultSubnets = await vpc.GetDefaultSubnets(defaultVpc)
  // const defaultSecurityGroup = securitygroup.NewDefaultSecurityGroup()

  // ...
}

main()
