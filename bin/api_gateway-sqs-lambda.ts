#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { ApiGatewaySqsLambdaStack } from '../lib/api_gateway-sqs-lambda-stack'

const envVars = {
  REGION: process.env.REGION || 'us-east-1',
}

const app = new cdk.App()
new ApiGatewaySqsLambdaStack(app, 'ApiGatewaySqsLambdaStack', {
  env: { region: envVars.REGION },
})
