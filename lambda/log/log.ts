// lambda/log/log.ts
import { SNSEvent } from 'aws-lambda';

export const handler = async (event: SNSEvent) => {
    console.log('Raw SNS event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const message = JSON.parse(record.Sns.Message);
        console.log('📞 Patient callback event received:', JSON.stringify(message, null, 2));
        console.log(`Patient ${message.patientId} waited ${message.waitTimeSeconds}s — callback triggered`);
    }

    return { statusCode: 200 };
};
