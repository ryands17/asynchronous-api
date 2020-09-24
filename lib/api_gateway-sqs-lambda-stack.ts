import * as cdk from '@aws-cdk/core'
import * as sqs from '@aws-cdk/aws-sqs'
import * as lambda from '@aws-cdk/aws-lambda'
import * as eventSrc from '@aws-cdk/aws-lambda-event-sources'

export class ApiGatewaySqsLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // The SQS Queue that API Gateway will talk to
    const queue = new sqs.Queue(this, 'async-requests', {
      queueName: 'async-requests',
      retentionPeriod: cdk.Duration.days(2),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
    })

    // The Lambda function responding to SQS messages
    const handler = new lambda.Function(this, 'request-handler', {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset('resources'),
      handler: 'index.handler',
      reservedConcurrentExecutions: 20,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    })
    handler.addEventSource(new eventSrc.SqsEventSource(queue, { batchSize: 1 }))
  }
}
