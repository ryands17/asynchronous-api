#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { ApiGatewaySqsLambdaStack } from '../lib/api_gateway-sqs-lambda-stack'

const REGION = process.env.REGION || 'us-east-1'
const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID

const app = new cdk.App()
new ApiGatewaySqsLambdaStack(app, 'ApiGatewaySqsLambdaStack', {
  env: { region: REGION, account: ACCOUNT_ID },
})
