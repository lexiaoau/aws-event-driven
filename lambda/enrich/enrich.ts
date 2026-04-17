import { DynamoDBStreamEvent } from 'aws-lambda';

export const handler = async (event: DynamoDBStreamEvent) => {
  const record = event.Records[0];
  const newImage = record.dynamodb?.NewImage;

  const enrichedEvent = {
    patientId: newImage?.patientId?.S,
    queueId: newImage?.queueId?.S,
    waitTimeSeconds: Number(newImage?.waitTimeSeconds?.N),
    callbackReason: 'EXCEEDED_WAIT_THRESHOLD',
    timestamp: new Date().toISOString(),
  };

  return enrichedEvent;
};
