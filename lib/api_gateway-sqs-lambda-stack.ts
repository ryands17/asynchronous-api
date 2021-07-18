import * as cdk from '@aws-cdk/core'
import * as sqs from '@aws-cdk/aws-sqs'
import * as lambda from '@aws-cdk/aws-lambda'
import * as eventSrc from '@aws-cdk/aws-lambda-event-sources'
import * as apiGw from '@aws-cdk/aws-apigateway'
import * as iam from '@aws-cdk/aws-iam'

const requestTemplate = [
  `Action=SendMessage`,
  `MessageBody=$input.json('$')`,
  `MessageAttribute.1.Name=requestTime`,
  `MessageAttribute.1.Value.StringValue=$context.requestTimeEpoch`,
  `MessageAttribute.1.Value.DataType=String`,
]

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
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources'),
      handler: 'index.handler',
      reservedConcurrentExecutions: 5,
      timeout: cdk.Duration.seconds(5),
      memorySize: 256,
    })
    handler.addEventSource(new eventSrc.SqsEventSource(queue, { batchSize: 1 }))

    // API Gateway as a proxy to SQS
    const api = new apiGw.RestApi(this, 'async-api', {
      restApiName: 'async-api',
      endpointTypes: [apiGw.EndpointType.REGIONAL],
      deployOptions: {
        stageName: 'dev',
        loggingLevel: apiGw.MethodLoggingLevel.INFO,
      },
    })

    const asyncApiApigRole = new iam.Role(this, 'asyncApiApigRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    })
    asyncApiApigRole.addToPolicy(
      new iam.PolicyStatement({
        resources: [queue.queueArn],
        actions: ['sqs:SendMessage'],
      })
    )

    const sqsIntegration = new apiGw.AwsIntegration({
      service: 'sqs',
      options: {
        credentialsRole: asyncApiApigRole,
        requestParameters: {
          'integration.request.header.Content-Type': `'application/x-www-form-urlencoded'`,
        },
        requestTemplates: {
          'application/json': requestTemplate.join('&'),
        },
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({ success: true }),
            },
          },
          {
            statusCode: '500',
            responseTemplates: {
              'application/json': JSON.stringify({
                success: false,
                error: 'Server Error!',
              }),
            },
            selectionPattern: '500',
          },
        ],
      },
      path: `${this.account}/${queue.queueName}`,
    })

    api.root.addMethod('POST', sqsIntegration, {
      requestValidatorOptions: { validateRequestBody: true },
      requestModels: {
        'application/json': new apiGw.Model(this, 'sqs-payload', {
          restApi: api,
          schema: {
            schema: apiGw.JsonSchemaVersion.DRAFT4,
            title: 'SQS Payload',
            type: apiGw.JsonSchemaType.OBJECT,
            required: ['data'],
            properties: {
              data: {
                type: apiGw.JsonSchemaType.STRING,
                minLength: 1,
              },
            },
          },
        }),
      },
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Content-Type': true,
          },
        },
      ],
    })
  }
}
