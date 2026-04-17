import { SNSEvent } from 'aws-lambda';

export const handler = async (event: SNSEvent) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.Sns.Message);
    console.log('📞 Patient callback event received:', message);
  }

  return { statusCode: 200 };
};
