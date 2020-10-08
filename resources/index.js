const AWS = require('aws-sdk')

const sqs = new AWS.SQS({
  region: process.env.AWS_REGION,
})

exports.handler = async event => {
  try {
    for (let message of event.Records) {
      console.log('*'.repeat(20))
      console.log('[main message]', message)
      console.log('*'.repeat(20))
      console.log('body', JSON.parse(message.body, null, 2))
      await deleteMessageFromQueue(message.receiptHandle)
    }

    return {
      statusCode: 200,
      body: JSON.stringify('success!'),
    }
  } catch (e) {
    console.error(e)
    return {
      statusCode: 500,
      error: JSON.stringify('Server error!'),
    }
  }
}

function deleteMessageFromQueue(receiptHandle) {
  if (receiptHandle) {
    return sqs
      .deleteMessage({
        QueueUrl: process.env.QUEUE_URL,
        ReceiptHandle: receiptHandle,
      })
      .promise()
  }
}
