import * as cdk from '@aws-cdk/core'
import * as sqs from '@aws-cdk/aws-sqs'
import * as lambda from '@aws-cdk/aws-lambda'
import * as eventSrc from '@aws-cdk/aws-lambda-event-sources'
import * as apiGw from '@aws-cdk/aws-apigateway'

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

    // API Gateway as a proxy to SQS
    const api = new apiGw.RestApi(this, 'async-api', {
      restApiName: 'async-api',
      endpointTypes: [apiGw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'dev',
      },
    })

    api.addRequestValidator('request-validator', {
      requestValidatorName: 'request-validator',
      validateRequestBody: false,
      validateRequestParameters: true,
    })

    const sqsIntegration = new apiGw.Integration({
      type: apiGw.IntegrationType.AWS,
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:${this.region}:sqs:path/${queue.queueName}`,
      options: {},
    })

    api.root.addMethod('POST', sqsIntegration, {})
  }
}
