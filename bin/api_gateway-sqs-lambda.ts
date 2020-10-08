#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { ApiGatewaySqsLambdaStack } from '../lib/api_gateway-sqs-lambda-stack'

const envVars = {
  REGION: process.env.REGION || 'us-east-1',
  ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
}

validateEnvVariables()
const app = new cdk.App()
new ApiGatewaySqsLambdaStack(app, 'ApiGatewaySqsLambdaStack', {
  env: { region: envVars.REGION, account: envVars.ACCOUNT_ID },
})

export function validateEnvVariables() {
  for (let variable in envVars) {
    if (!envVars[variable as keyof typeof envVars])
      throw Error(`Environment variable ${variable} is not defined!`)
  }
}
