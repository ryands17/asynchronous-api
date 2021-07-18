exports.handler = async event => {
  try {
    for (let message of event.Records) {
      console.log('*'.repeat(20))
      console.log('[main message]', message)
      console.log('*'.repeat(20))
      console.log('body', JSON.parse(message.body, null, 2))
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
