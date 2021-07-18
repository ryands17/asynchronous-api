import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as ApiGatewaySqsLambda from '../lib/api_gateway-sqs-lambda-stack'

test('SQS Queue, Lambda Handler, and the corresponding Event Source', () => {
  const stack = createStack()
  expectCDK(stack).to(
    haveResourceLike('AWS::SQS::Queue', {
      MessageRetentionPeriod: 172800,
      QueueName: 'async-requests',
      ReceiveMessageWaitTimeSeconds: 20,
    })
  )

  expectCDK(stack).to(
    haveResourceLike('AWS::Lambda::Function', {
      Handler: 'index.handler',
      Runtime: 'nodejs14.x',
      MemorySize: 256,
      ReservedConcurrentExecutions: 5,
      Timeout: 5,
    })
  )

  expectCDK(stack).to(
    haveResourceLike('AWS::Lambda::EventSourceMapping', {
      EventSourceArn: {},
      FunctionName: {},
      BatchSize: 1,
    })
  )
})

test('API Gateway and its corresponding IAM Role', () => {
  const stack = createStack()
  expectCDK(stack).to(
    haveResourceLike('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      Name: 'async-api',
    })
  )

  expectCDK(stack).to(
    haveResourceLike('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'apigateway.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
    })
  )
})

test(`API Gateway 'POST' Method and its corresponding Model (Schema)`, () => {
  const stack = createStack()
  expectCDK(stack).to(
    haveResourceLike('AWS::ApiGateway::Method', {
      HttpMethod: 'POST',
      AuthorizationType: 'NONE',
      Integration: {
        IntegrationHttpMethod: 'POST',
        IntegrationResponses: [
          {
            ResponseTemplates: {
              'application/json': '{"success":true}',
            },
            StatusCode: '200',
          },
          {
            ResponseTemplates: {
              'application/json': '{"success":false,"error":"Server Error!"}',
            },
            SelectionPattern: '500',
            StatusCode: '500',
          },
        ],
        RequestParameters: {
          'integration.request.header.Content-Type': "'application/json'",
        },
        RequestTemplates: {
          'application/json':
            "$context.requestOverride.querystring.MessageBody=$input.json('$')",
        },
        Type: 'AWS',
      },
      MethodResponses: [
        {
          ResponseParameters: {
            'method.response.header.Content-Type': true,
          },
          StatusCode: '200',
        },
        {
          ResponseParameters: {
            'method.response.header.Content-Type': true,
          },
          StatusCode: '500',
        },
      ],
      RequestModels: {
        'application/json': {},
      },
    })
  )

  expectCDK(stack).to(
    haveResourceLike('AWS::ApiGateway::Model', {
      ContentType: 'application/json',
      Schema: {
        $schema: 'http://json-schema.org/draft-04/schema#',
        title: 'SQS Payload',
        type: 'object',
        required: ['data'],
        properties: {
          data: {
            type: 'string',
            minLength: 1,
          },
        },
      },
    })
  )
})

function createStack() {
  const app = new cdk.App()
  return new ApiGatewaySqsLambda.ApiGatewaySqsLambdaStack(app, 'AsyncAPI', {
    env: { region: process.env.REGION },
  })
}
