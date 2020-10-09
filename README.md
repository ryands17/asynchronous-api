# Asynchronous API handling with API Gateway, SQS and Lambda

![Build Status](https://github.com/ryands17/asynchronous-api/workflows/CI/badge.svg)

This is an [aws-cdk](https://aws.amazon.com/cdk/) project where you can create a highly scalable asynchronous API with API Gateway and SQS which in turn invokes Lambda.

Inspired from [this](https://codeburst.io/100-serverless-asynchronous-api-with-apig-sqs-and-lambda-2506a039b4d) blog post.

## Steps

1. Rename the `.example.env` file to `.env` and replace all the values with predefined values for your stack.

**_Note_**: All the variables are mandatory! Without that, the stack wouldn't work.

3. Run `yarn` (recommended) or `npm install`

4. Run `yarn cdk deploy --profile profileName` to deploy the stack to your specified region. You can skip providing the profile name if it is `default`.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `yarn watch` watch for changes and compile
- `yarn test` perform the jest unit tests
- `yarn cdk deploy` deploy this stack to your default AWS account/region
- `yarn cdk diff` compare deployed stack with current state
- `yarn cdk synth` emits the synthesized CloudFormation template
